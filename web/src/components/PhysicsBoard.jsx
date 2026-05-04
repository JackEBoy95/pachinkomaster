import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import Matter from 'matter-js'

// Module-level image cache so each skin loads only once across renders
const imgCache = new Map()
// Pre-rasterized circular bitmaps — avoids per-frame SVG rasterization + clip
const rasterCache = new Map() // url -> HTMLCanvasElement
const RASTER_SIZE = 128       // render at 2× for retina sharpness

function preRasterize(src, img) {
  if (rasterCache.has(src)) return
  const c = document.createElement('canvas')
  c.width = c.height = RASTER_SIZE
  const cx = c.getContext('2d')
  cx.beginPath()
  cx.arc(RASTER_SIZE / 2, RASTER_SIZE / 2, RASTER_SIZE / 2, 0, Math.PI * 2)
  cx.clip()
  cx.drawImage(img, 0, 0, RASTER_SIZE, RASTER_SIZE)
  rasterCache.set(src, c)
}

function getCachedImage(src) {
  if (imgCache.has(src)) return imgCache.get(src)
  const img = new Image()
  img.src = src
  img.onload  = () => { img._ready = true; preRasterize(src, img) }
  img.onerror = () => { img._error = true }
  imgCache.set(src, img)
  return img
}

// Prize image cache — keyed by prize id, invalidated when src changes
const prizeImgCache = new Map() // id -> { img, src }
function getPrizeImage(prize) {
  if (!prize.image) return null
  const cached = prizeImgCache.get(prize.id)
  if (cached && cached.src === prize.image) return cached.img
  const img = new Image()
  img.src = prize.image
  img.onload = () => { img._ready = true }
  prizeImgCache.set(prize.id, { img, src: prize.image })
  return img
}

const WALL_THICKNESS = 40
const SLOT_H = 52
const PEG_ROWS = 9
const STUCK_SPEED   = 0.6    // px/tick — below this we consider a ball "stalled"
const STUCK_DELAY   = 2500   // ms of stall before a nudge
const GLOBAL_RESCUE = 15000  // ms since last spawn before all stragglers get rescued

function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// Compute the largest ball radius that can physically pass between pegs at the
// requested density on a board of width W.
//
// Derivation: for a ball of radius BR and peg radius PEG_R ≈ 0.42·BR to fit
// through the gap between same-row pegs we need:
//   gap = spacing − 2·PEG_R ≥ 2·BR + clearance
//   spacing = usableW / (cols − 1)
// Substituting PEG_R = 0.42·BR and solving for BR gives the density cap below.
// We also keep the original W/28 hard cap so very narrow boards stay sane.
function computeBR(W, ballSize, pegDensity) {
  const k          = Math.max(3, pegDensity - 1)           // cols − 1
  const densityCap = Math.floor((W - 6 * (k + 1)) / (0.84 + 2.84 * k))
  const widthCap   = Math.floor(W / 28)
  return Math.min(ballSize, Math.max(6, Math.min(densityCap, widthCap)))
}

// Kick a stuck ball toward the board centre and downward
function rescueBall(ball, W) {
  const toCenter = ball.position.x < W / 2 ? 1 : -1
  Matter.Body.setVelocity(ball, {
    x: toCenter * (Math.random() * 3 + 2),
    y: Math.random() * 3 + 4,   // always pushes downward
  })
}

const PhysicsBoard = forwardRef(function PhysicsBoard(
  { prizes, activePlayer, onBallLanded, speed, ballSize, pegDensity, bounciness, onPegHit, skin, locked },
  ref
) {
  const containerRef     = useRef(null)
  const canvasRef        = useRef(null)
  const engineRef        = useRef(null)
  const runnerRef        = useRef(null)
  const pegPositionsRef  = useRef([])
  const pegRadiusRef     = useRef(5)
  const trailsRef        = useRef([])
  const landedRef        = useRef(new Set())
  const aimXRef          = useRef(null)
  const hoveringRef      = useRef(false)
  const droppingRef      = useRef(false)
  const inFlightRef      = useRef(0)
  const stuckTimersRef   = useRef(new Map()) // ballId -> timestamp when slow motion first detected
  const lastSpawnTimeRef = useRef(0)         // timestamp of most recent ball spawn
  const frameCountRef    = useRef(0)         // increments each draw tick for throttling
  const refreshStylesRef     = useRef(null)
  const resizeDebounceRef    = useRef(null)
  const effectiveBallSizeRef = useRef(ballSize)  // capped to board width — kept in sync at setup
  // Queue of { x, player } entries waiting to enter the physics world.
  // Used on mobile to cap concurrent balls and keep the simulation fast.
  const spawnQueueRef    = useRef([])
  const isTouchRef       = useRef(false)  // true once any touch event fires — suppresses synthetic mouse aim
  const physicsWorldWRef = useRef(0)      // W used to build the current physics engine (walls, pegs)
  const [dropping, setDropping]   = useState(false)
  const [resizeKey, setResizeKey] = useState(0)  // increments → triggers engine rebuild on resize

  const prizesRef       = useRef(prizes)
  const activePlayerRef = useRef(activePlayer)
  const speedRef        = useRef(speed)
  const ballSizeRef     = useRef(ballSize)
  const bouncinessRef   = useRef(bounciness)
  const onPegHitRef     = useRef(onPegHit)
  useEffect(() => { prizesRef.current       = prizes       }, [prizes])
  useEffect(() => { activePlayerRef.current = activePlayer }, [activePlayer])
  useEffect(() => { speedRef.current        = speed        }, [speed])
  useEffect(() => { ballSizeRef.current     = ballSize     }, [ballSize])
  useEffect(() => { bouncinessRef.current   = bounciness   }, [bounciness])
  useEffect(() => { onPegHitRef.current     = onPegHit     }, [onPegHit])

  // ── Peg grid ──────────────────────────────────────────────────────────────
  // Even rows: `cols` pegs spanning right up to the walls
  //   x = margin + spacing * col   (col 0 → cols-1)
  //   First peg sits just PEG_R*2+4 px from the left wall
  //   Last  peg sits just PEG_R*2+4 px from the right wall
  //
  // Odd rows: `cols-1` pegs, staggered half a spacing inward — fill the gaps
  //   x = margin + spacing * (col + 0.5)
  //
  // Result: no exploitable gap at either wall edge
  const buildPegs = useCallback((W, H, cols, pegR, numRows) => {
    const pegs    = []
    const boardH  = H - SLOT_H - 16
    const rowSpY  = boardH / (numRows + 1)
    const margin  = pegR + 3
    const usableW = W - margin * 2
    const spacing = cols > 1 ? usableW / (cols - 1) : usableW

    for (let row = 0; row < numRows; row++) {
      const y = rowSpY * (row + 1) + 8
      if (row % 2 === 0) {
        for (let col = 0; col < cols; col++) {
          pegs.push({ x: margin + spacing * col, y })
        }
      } else {
        for (let col = 0; col < cols - 1; col++) {
          pegs.push({ x: margin + spacing * (col + 0.5), y })
        }
      }
    }
    return pegs
  }, [])

  useEffect(() => {
    refreshStylesRef.current?.()
  }, [skin])

  // ── Engine setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const canvas = canvasRef.current
    let W = container.offsetWidth
    let H = container.offsetHeight
    // Container is hidden (e.g. mobile tab switch to Config/Scores).
    // Set up a lightweight watcher so we rebuild the engine once it becomes
    // visible again — without this, settings changes while hidden leave
    // engineRef null permanently and the board appears frozen.
    if (W === 0 || H === 0) {
      const watcher = new ResizeObserver(() => {
        if (container.offsetWidth > 0 && container.offsetHeight > 0) {
          watcher.disconnect()
          setResizeKey(k => k + 1)
        }
      })
      watcher.observe(container)
      return () => watcher.disconnect()
    }
    // Scale canvas to physical pixels for crisp rendering on retina / high-DPR
    // mobile screens (iPhone dpr=2–3). Without this every canvas pixel is a blurry
    // 2–3px block, making the ball visually larger than its physics circle.
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width  = W * dpr
    canvas.height = H * dpr

    // Ball radius scales with both board width AND peg density so balls always
    // physically fit through the gaps regardless of window size.
    const BR    = computeBR(W, ballSize, pegDensity)
    const PEG_R = Math.max(3, Math.round(BR * 0.42))
    const usableW      = W - (PEG_R + 3) * 2
    const maxSafeCols  = Math.max(4, Math.floor(1 + usableW / (2 * BR + 2 * PEG_R + 4)))
    const effectiveCols = Math.min(pegDensity, maxSafeCols)
    effectiveBallSizeRef.current = BR   // spawnBall reads this
    physicsWorldWRef.current     = W    // drop functions must clamp to THIS width, not live container width
    // More peg rows on portrait boards so the ball has more decisions to make
    const aspectRatio  = H / W
    const pegRows      = aspectRatio > 1.4 ? 14 : aspectRatio > 0.9 ? 11 : PEG_ROWS
    const BNC   = bounciness
    pegRadiusRef.current = PEG_R

    const engine = Matter.Engine.create({ gravity: { y: 1.2 } })
    engineRef.current = engine

    const mkStatic = (extra) => ({ isStatic: true, friction: 0.05, ...extra })
    const ground    = Matter.Bodies.rectangle(W / 2, H + WALL_THICKNESS / 2, W + 100, WALL_THICKNESS,
                        mkStatic({ restitution: 0.05, label: 'ground' }))
    const leftWall  = Matter.Bodies.rectangle(-WALL_THICKNESS / 2, H / 2, WALL_THICKNESS, H * 2,
                        mkStatic({ restitution: BNC * 0.6, label: 'wall' }))
    const rightWall = Matter.Bodies.rectangle(W + WALL_THICKNESS / 2, H / 2, WALL_THICKNESS, H * 2,
                        mkStatic({ restitution: BNC * 0.6, label: 'wall' }))

    const slotDividers = prizesRef.current.slice(1).map((_, i) => {
      const x = (W / prizesRef.current.length) * (i + 1)
      return Matter.Bodies.rectangle(x, H - SLOT_H / 2, 3, SLOT_H,
        mkStatic({ restitution: 0.1, label: 'divider' }))
    })

    const pegs = buildPegs(W, H, effectiveCols, PEG_R, pegRows)
    pegPositionsRef.current = pegs
    const pegBodies = pegs.map(({ x, y }) =>
      Matter.Bodies.circle(x, y, PEG_R, mkStatic({ restitution: BNC, label: 'peg' }))
    )

    Matter.Composite.add(engine.world, [ground, leftWall, rightWall, ...slotDividers, ...pegBodies])

    const runner = Matter.Runner.create()
    runnerRef.current = runner

    Matter.Events.on(engine, 'collisionStart', ({ pairs }) => {
      pairs.forEach(({ bodyA, bodyB }) => {
        const ball  = bodyA.label === 'ball' ? bodyA : bodyB.label === 'ball' ? bodyB : null
        const other = ball === bodyA ? bodyB : bodyA
        if (!ball) return

        if (other.label === 'peg') onPegHitRef.current?.()

        if (other.label === 'ground' && !landedRef.current.has(ball.id)) {
          landedRef.current.add(ball.id)
          const cp  = prizesRef.current
          const idx = Math.max(0, Math.min(cp.length - 1, Math.floor((ball.position.x / W) * cp.length)))
          inFlightRef.current = Math.max(0, inFlightRef.current - 1)
          const isLast = inFlightRef.current === 0

          // Remove from physics world immediately so it stops contributing to
          // collision checks — this is the main performance fix for large drops
          Matter.Composite.remove(engine.world, ball)

          // Drain spawn queue: one ball landed → one queued ball enters the world.
          // This keeps concurrent physics bodies capped on mobile without slowing
          // down the overall drop (inFlightRef already counted queued balls).
          const next = spawnQueueRef.current.shift()
          if (next) spawnBall(next.x, next.player)

          setTimeout(() => {
            onBallLanded(idx, ball.playerId ?? null, isLast)
            if (isLast) {
              droppingRef.current = false
              setDropping(false)
            }
          }, 350)
        }
      })
    })

    // ── CSS var cache — read once per ~2 s instead of every frame ───────────
    let cssVars = {}
    function refreshCSSVars() {
      cssVars = {
        bgBoard:     getCSSVar('--bg-board')     || '#0D0D1A',
        boardLine:   getCSSVar('--board-line')   || 'rgba(42,42,68,0.4)',
        pegColor:    getCSSVar('--peg-color')    || '#F5C842',
        pegGlow:     getCSSVar('--peg-glow')     || 'rgba(245,200,66,0.5)',
        glowSpread:  parseInt(getCSSVar('--glow-spread')) || 12,
        ballTrail:   getCSSVar('--ball-trail')   || 'rgba(255,79,163,0.6)',
        bgPanel:     getCSSVar('--bg-panel')     || '#12121E',
        slotDivider: getCSSVar('--slot-divider') || 'rgba(245,200,66,0.3)',
        textSec:     getCSSVar('--text-secondary') || '#6A6A8A',
        fxGlow:      getCSSVar('--fx-glow') === '1',
      }
    }
    refreshCSSVars()

    // ── Peg offscreen canvas — blit once per frame instead of N gradients ────
    let pegCanvas = null
    function buildPegCanvas() {
      pegCanvas = document.createElement('canvas')
      pegCanvas.width = W * dpr; pegCanvas.height = H * dpr
      const pc = pegCanvas.getContext('2d')
      pc.scale(dpr, dpr) // all peg coords are CSS pixels → scale to physical
      if (cssVars.fxGlow) {
        pc.shadowColor = cssVars.pegGlow
        pc.shadowBlur  = cssVars.glowSpread
      }
      pegPositionsRef.current.forEach(({ x, y }) => {
        if (cssVars.fxGlow) {
          const gr = pc.createRadialGradient(x, y, 0, x, y, PEG_R * 3)
          gr.addColorStop(0, cssVars.pegGlow); gr.addColorStop(1, 'transparent')
          pc.fillStyle = gr
          pc.beginPath(); pc.arc(x, y, PEG_R * 3, 0, Math.PI * 2); pc.fill()
        }
        pc.fillStyle = cssVars.pegColor
        pc.beginPath(); pc.arc(x, y, PEG_R, 0, Math.PI * 2); pc.fill()
      })
      pc.shadowBlur = 0
    }
    buildPegCanvas()
    refreshStylesRef.current = () => { refreshCSSVars(); buildPegCanvas() }

    // ── Draw loop ────────────────────────────────────────────────────────────
    let animId
    const draw = () => {
      animId = requestAnimationFrame(draw)
      // Only tick physics when balls are actually in flight — saves significant
      // CPU on desktop where clearRect on a large canvas is expensive each frame
      if (inFlightRef.current > 0) {
        Matter.Runner.tick(runner, engine, 1000 / 60)
      }
      const ctx = canvas.getContext('2d')
      // Reset to DPR-scaled identity each frame so CSS-pixel coordinates from
      // Matter.js map cleanly to physical pixels. setTransform replaces the
      // current matrix rather than accumulating, so save/restore within the
      // frame never corrupt the base scale.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)

      ctx.fillStyle = cssVars.bgBoard
      ctx.fillRect(0, 0, W, H)

      // ── Load tier — drives all quality decisions this frame ───────────────
      const inFlight   = inFlightRef.current
      const isHighLoad = inFlight > 50   // heavy multi-player drop
      const isMedLoad  = inFlight > 10   // moderate load
      document.body.classList.toggle('dropping', inFlight > 0)

      if (!isHighLoad) {
        ctx.strokeStyle = cssVars.boardLine
        ctx.lineWidth = 1
        for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
        for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
      }

      // Aim
      if (hoveringRef.current && aimXRef.current !== null && !droppingRef.current) {
        const ax = aimXRef.current
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1
        ctx.setLineDash([6, 6])
        ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, H - SLOT_H); ctx.stroke()
        ctx.setLineDash([])
        const ap = activePlayerRef.current
        ctx.fillStyle = ap?.color ? hexToRgba(ap.color, 0.45) : 'rgba(255,255,255,0.35)'
        ctx.beginPath(); ctx.arc(ax, BR + 6, BR, 0, Math.PI * 2); ctx.fill()
      }

      // ── Stuck-ball rescue (throttled: only every 20 frames) ─────────────
      frameCountRef.current += 1
      if (inFlightRef.current > 0 && frameCountRef.current % 20 === 0) {
        const now        = Date.now()
        const ballBodies = Matter.Composite.allBodies(engine.world).filter(b => b.label === 'ball')

        ballBodies.forEach(b => {
          const spd = Math.sqrt(b.velocity.x ** 2 + b.velocity.y ** 2)
          if (spd < STUCK_SPEED) {
            if (!stuckTimersRef.current.has(b.id)) {
              stuckTimersRef.current.set(b.id, now)
            } else if (now - stuckTimersRef.current.get(b.id) > STUCK_DELAY) {
              rescueBall(b, W)
              stuckTimersRef.current.delete(b.id)
            }
          } else {
            stuckTimersRef.current.delete(b.id)
          }
        })

        if (lastSpawnTimeRef.current > 0 && now - lastSpawnTimeRef.current > GLOBAL_RESCUE) {
          ballBodies.forEach(b => rescueBall(b, W))
          lastSpawnTimeRef.current = now
        }
      }

      // Trails — only on glow-enabled themes, then tiered by load
      const trailActive = cssVars.fxGlow && !isHighLoad
      const trailDecay  = isMedLoad ? 0.10 : 0.05   // faster fade under medium load
      trailsRef.current = trailsRef.current.filter(t => t.alpha > 0)
      if (trailActive) {
        const trailColor = cssVars.ballTrail
        trailsRef.current.forEach(t => {
          ctx.globalAlpha = t.alpha
          ctx.fillStyle = trailColor
          ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill()
          t.alpha -= trailDecay
        })
        ctx.globalAlpha = 1
      } else {
        trailsRef.current.length = 0
      }

      // Pegs — blit pre-rendered offscreen canvas (full quality) or fast fallback.
      // Draw into CSS-pixel space (0, 0, W, H); the dpr setTransform above maps
      // that to physical pixels, giving crisp output on retina displays.
      if (!isHighLoad && pegCanvas) {
        ctx.drawImage(pegCanvas, 0, 0, W, H)
      } else {
        ctx.fillStyle = cssVars.pegColor
        pegPositionsRef.current.forEach(({ x, y }) => {
          ctx.beginPath(); ctx.arc(x, y, PEG_R, 0, Math.PI * 2); ctx.fill()
        })
      }

      // Balls
      Matter.Composite.allBodies(engine.world)
        .filter(b => b.label === 'ball')
        .forEach(b => {
          const { x, y } = b.position
          const r = b.ballRadius || BR
          if (trailActive) trailsRef.current.push({ x, y, r: r * 0.65, alpha: 0.45 })

          // Drop shadow — skip on high load
          if (!isHighLoad) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)'
            ctx.beginPath(); ctx.ellipse(x, y + r * 0.6, r * 0.8, r * 0.3, 0, 0, Math.PI * 2); ctx.fill()
          }

          if (b.ballSkin?.startsWith('cflag:')) {
            // Use pre-rasterized bitmap — no save/clip/restore, just a fast blit
            const code   = b.ballSkin.replace('cflag:', '')
            const src    = `https://hatscripts.github.io/circle-flags/flags/${code}.svg`
            const bitmap = rasterCache.get(src)
            if (bitmap) {
              ctx.drawImage(bitmap, x - r, y - r, r * 2, r * 2)
            } else {
              getCachedImage(src) // queue the load if not started
              ctx.fillStyle = b.ballColor || '#888'
              ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
            }
            if (!isMedLoad) {
              ctx.fillStyle = 'rgba(255,255,255,0.2)'
              ctx.beginPath(); ctx.arc(x - r * 0.28, y - r * 0.28, r * 0.28, 0, Math.PI * 2); ctx.fill()
            }
          } else {
            // Standard gradient ball
            const bg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r)
            const bc = b.ballColor || '#FF4FA3'
            bg.addColorStop(0, shiftColor(bc, 65)); bg.addColorStop(0.55, bc); bg.addColorStop(1, shiftColor(bc, -45))
            ctx.fillStyle = bg
            if (cssVars.fxGlow && !isHighLoad) { ctx.shadowColor = bc; ctx.shadowBlur = 18 }
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
            ctx.shadowBlur = 0

            if (!isMedLoad) {
              ctx.fillStyle = 'rgba(255,255,255,0.28)'
              ctx.beginPath(); ctx.arc(x - r * 0.28, y - r * 0.28, r * 0.28, 0, Math.PI * 2); ctx.fill()
            }

            if (b.ballSkin?.startsWith('img:')) {
              const key = b.ballSkin.replace('img:', '')
              const img = getCachedImage(`/skins/${key}.png`)
              if (img._ready) {
                ctx.save()
                ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, Math.PI * 2); ctx.clip()
                ctx.drawImage(img, x - r * 0.78, y - r * 0.78, r * 1.56, r * 1.56)
                ctx.restore()
              }
            } else if (b.ballSkin?.startsWith('emoji:')) {
              const cp = b.ballSkin.replace('emoji:', '')
              const img = getCachedImage(`/emojis/${cp}.svg`)
              if (img._ready) {
                ctx.save()
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip()
                ctx.drawImage(img, x - r, y - r, r * 2, r * 2)
                ctx.restore()
              }
            } else if (b.playerName) {
              ctx.fillStyle = 'rgba(255,255,255,0.9)'
              ctx.font = `bold ${Math.max(7, Math.round(r * 0.65))}px Rajdhani, sans-serif`
              ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
              ctx.fillText(b.playerName.slice(0, 4), x, y + 1)
            }
          }
        })

      // Slot bar
      ctx.fillStyle = cssVars.bgPanel
      ctx.fillRect(0, H - SLOT_H, W, SLOT_H)
      const cp = prizesRef.current; const sW = W / cp.length
      cp.forEach((prize, i) => {
        const sx = i * sW, mx = sx + sW / 2
        ctx.fillStyle = hexToRgba(prize.color, 0.12); ctx.fillRect(sx + 1, H - SLOT_H, sW - 2, SLOT_H)
        ctx.fillStyle = prize.color; ctx.fillRect(sx + 1, H - SLOT_H, sW - 2, 3)
        if (i > 0) {
          ctx.strokeStyle = cssVars.slotDivider; ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(sx, H - SLOT_H); ctx.lineTo(sx, H); ctx.stroke()
        }

        const prizeImg = getPrizeImage(prize)
        if (prizeImg?._ready) {
          // Image slot: thumbnail on left, label+pts on right
          const imgSize = SLOT_H - 10
          const imgX = sx + 4
          const imgY = H - SLOT_H + 5
          ctx.save()
          ctx.beginPath()
          ctx.roundRect(imgX, imgY, imgSize, imgSize, 3)
          ctx.clip()
          ctx.drawImage(prizeImg, imgX, imgY, imgSize, imgSize)
          ctx.restore()
          const textX = imgX + imgSize + 4
          const textW = sW - imgSize - 10
          ctx.fillStyle = prize.color; ctx.font = 'bold 10px Rajdhani, sans-serif'
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
          const label = prize.label.length > 8 ? prize.label.slice(0, 7) + '…' : prize.label
          ctx.fillText(label, textX, H - SLOT_H + 16)
          ctx.fillStyle = cssVars.textSec; ctx.font = '600 9px Rajdhani, sans-serif'
          ctx.fillText(`${prize.points}pts`, textX, H - SLOT_H + 30)
        } else {
          ctx.fillStyle = prize.color; ctx.font = 'bold 11px Rajdhani, sans-serif'
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(prize.label.length > 10 ? prize.label.slice(0, 9) + '…' : prize.label, mx, H - SLOT_H + 18)
          ctx.fillStyle = cssVars.textSec; ctx.font = '600 10px Rajdhani, sans-serif'
          ctx.fillText(`${prize.points}pts`, mx, H - SLOT_H + 34)
        }
      })
    }
    draw()

    const ro = new ResizeObserver(() => {
      const newW = container.offsetWidth
      const newH = container.offsetHeight
      // Container is hidden (mobile tab switch) — ignore completely
      if (newW === 0 || newH === 0) return
      canvas.width = newW * dpr; canvas.height = newH * dpr
      // If dimensions changed meaningfully, schedule a full engine rebuild
      if (Math.abs(newW - W) > 30 || Math.abs(newH - H) > 30) {
        clearTimeout(resizeDebounceRef.current)
        resizeDebounceRef.current = setTimeout(() => setResizeKey(k => k + 1), 350)
      }
      W = newW; H = newH
      // Recompute peg layout for the new visual size so the peg canvas is
      // redrawn correctly. Ball size (effectiveBallSizeRef) is intentionally
      // NOT updated here — it must stay at the value used to build the physics
      // world (walls/pegs) so balls spawned during the debounce window are
      // correctly sized for the CURRENT physics boundaries, not the new ones.
      const resBR          = computeBR(W, ballSize, pegDensity)
      const resPEG_R       = Math.max(3, Math.round(resBR * 0.42))
      const resUsableW     = W - (resPEG_R + 3) * 2
      const resMaxSafeCols = Math.max(4, Math.floor(1 + resUsableW / (2 * resBR + 2 * resPEG_R + 4)))
      const resCols        = Math.min(pegDensity, resMaxSafeCols)
      const resAspect      = H / W
      const resPegRows     = resAspect > 1.4 ? 14 : resAspect > 0.9 ? 11 : PEG_ROWS
      pegPositionsRef.current = buildPegs(W, H, resCols, resPEG_R, resPegRows)
      buildPegCanvas()
    })
    ro.observe(container)

    return () => {
      cancelAnimationFrame(animId); ro.disconnect()
      Matter.Runner.stop(runner); Matter.Engine.clear(engine)
      droppingRef.current = false; inFlightRef.current = 0; setDropping(false)
      stuckTimersRef.current.clear(); lastSpawnTimeRef.current = 0
      spawnQueueRef.current = []
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prizes.length, ballSize, pegDensity, bounciness, buildPegs, onBallLanded, resizeKey])

  // ── Spawn one ball ────────────────────────────────────────────────────────
  // All balls spawn from the SAME x/y position.
  // The "funnel" effect comes from randomised initial velocity — not position spread.
  const spawnBall = useCallback((x, player) => {
    if (!engineRef.current) return
    const BR  = effectiveBallSizeRef.current  // scaled to board width at setup time
    const BNC = bouncinessRef.current
    const mult = speedRef.current === 'slow' ? 0.55 : speedRef.current === 'fast' ? 2.2 : 1
    engineRef.current.gravity.y = 1.2 * mult

    const ball = Matter.Bodies.circle(x, BR + 2, BR, {
      restitution: BNC, friction: 0.04, density: 0.002, label: 'ball',
    })
    const p = player || activePlayerRef.current
    ball.ballColor  = p?.color    || '#FF4FA3'
    ball.playerName = p?.name     || ''
    ball.ballSkin   = p?.ballSkin || ''
    ball.playerId   = p?.id       ?? null
    ball.ballRadius = BR

    // Funnel-style velocity: random angle in a cone, faster on fast mode
    const cone    = Math.PI * 0.35          // ±35° spread
    const angle   = (Math.random() - 0.5) * cone
    const spd     = (Math.random() * 2 + 1) * mult
    Matter.Body.setVelocity(ball, { x: Math.sin(angle) * spd, y: Math.cos(angle) * spd * 0.3 })

    landedRef.current.delete(ball.id)
    lastSpawnTimeRef.current = Date.now()
    Matter.Composite.add(engineRef.current.world, ball)
  }, [])

  // ── Drop N balls for one player (from aim point) ─────────────────────────
  const dropBalls = useCallback((count = 1, player) => {
    if (!engineRef.current || droppingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    // Use the W the physics engine was built with — NOT the live container width.
    // During the 350ms resize debounce the container may already report the new
    // (larger) size while walls/pegs are still at the old size.  Spawning beyond
    // the old right wall puts balls outside the physics world and they get stuck.
    const W  = physicsWorldWRef.current || containerRef.current?.offsetWidth || canvas.offsetWidth
    const BR = ballSizeRef.current
    const x  = aimXRef.current !== null
      ? Math.max(BR + 2, Math.min(W - BR - 2, aimXRef.current))
      : W / 2

    droppingRef.current = true
    setDropping(true)
    // Set total expected BEFORE any setTimeout fires so early-landing balls
    // never see inFlightRef hit 0 prematurely
    inFlightRef.current = count

    const minMs  = speedRef.current === 'fast' ? 15 : speedRef.current === 'slow' ? 60 : 35
    const stagger = Math.max(minMs, Math.round(400 / count))
    for (let i = 0; i < count; i++) {
      setTimeout(() => spawnBall(x, player), i * stagger)
    }
  }, [spawnBall])

  // ── Drop all players simultaneously ──────────────────────────────────────
  // spread: 0 = all from same x | 'funnel' = ±20% of W around centre | 'shower' = full width
  const dropAllPlayers = useCallback((players, count = 1, spread = 0) => {
    if (!engineRef.current || droppingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    // Use the W the physics engine was built with — NOT the live container width.
    // During the 350ms resize debounce the container may already report the new
    // (larger) size while walls/pegs are still at the old size.  Spawning beyond
    // the old right wall puts balls outside the physics world and they get stuck.
    const W  = physicsWorldWRef.current || containerRef.current?.offsetWidth || canvas.offsetWidth
    const BR = ballSizeRef.current
    const centreX = aimXRef.current !== null
      ? Math.max(BR + 2, Math.min(W - BR - 2, aimXRef.current))
      : W / 2

    // ── Preload all player skin images before any ball spawns ────────────────
    // Kicks off CDN fetches immediately so flag images arrive before balls land,
    // rather than being fetched lazily per draw-frame.
    players.forEach(p => {
      if (!p.ballSkin) return
      if (p.ballSkin.startsWith('cflag:')) {
        getCachedImage(`https://hatscripts.github.io/circle-flags/flags/${p.ballSkin.replace('cflag:', '')}.svg`)
      } else if (p.ballSkin.startsWith('emoji:')) {
        getCachedImage(`/emojis/${p.ballSkin.replace('emoji:', '')}.svg`)
      }
    })

    droppingRef.current = true
    setDropping(true)

    const allDrops = []
    players.forEach(player => {
      for (let i = 0; i < count; i++) allDrops.push(player)
    })
    // Set total expected BEFORE any setTimeout fires — prevents early-landing
    // balls from seeing inFlightRef hit 0 before all balls are even spawned
    inFlightRef.current = allDrops.length
    // Shuffle spawn order each call so no player gets a consistent lane
    for (let i = allDrops.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allDrops[i], allDrops[j]] = [allDrops[j], allDrops[i]]
    }

    const getX = () => {
      if (spread === 'funnel') {
        const x = centreX + (Math.random() - 0.5) * W * 0.2
        return Math.max(BR + 2, Math.min(W - BR - 2, x))
      }
      if (spread === 'shower') return BR + 2 + Math.random() * (W - (BR + 2) * 2)
      return centreX
    }

    const minMs = speedRef.current === 'fast' ? 10 : speedRef.current === 'slow' ? 50 : 20

    // Cap concurrent bodies in the physics world — Matter.js collision detection
    // is O(n²) so 50+ simultaneous balls tanks frame rate on both mobile and desktop.
    // inFlightRef still counts the full total; spawnQueueRef drains as balls land.
    const isMobile = W < 600
    const concurrentLimit = isMobile ? 20 : Math.min(allDrops.length, 25)

    if (concurrentLimit >= allDrops.length) {
      // Desktop / small drop: stagger everything normally
      const stagger = Math.max(minMs, Math.round(500 / allDrops.length))
      allDrops.forEach((player, i) => {
        setTimeout(() => spawnBall(getX(), player), i * stagger)
      })
    } else {
      // Mobile queue mode: spawn first batch now, rest drain via collision handler
      spawnQueueRef.current = allDrops.slice(concurrentLimit).map(p => ({ x: getX(), player: p }))
      const stagger = Math.max(minMs, Math.round(400 / concurrentLimit))
      for (let i = 0; i < concurrentLimit; i++) {
        setTimeout(() => spawnBall(getX(), allDrops[i]), i * stagger)
      }
    }
  }, [spawnBall])

  useImperativeHandle(ref, () => ({ dropBalls, dropAllPlayers }), [dropBalls, dropAllPlayers])

  // Desktop: track cursor position for the aim guide and drop-from-cursor.
  // Skipped on touch devices — synthetic mousemove from taps would lock the aim
  // at the last tap position and affect all subsequent button-triggered drops.
  const handleMouseMove = useCallback((e) => {
    if (isTouchRef.current) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    aimXRef.current = e.clientX - rect.left
  }, [])

  // Mobile tap: use touch X for this drop only, then clear aim so the next
  // button-triggered drop falls from centre. preventDefault stops the browser
  // firing a synthetic click event after touchend (which would double-drop).
  const handleTouchEnd = useCallback((e) => {
    isTouchRef.current = true
    if (locked || droppingRef.current) return
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const touch = e.changedTouches[0]
    aimXRef.current = touch.clientX - rect.left
    dropBalls(1)
    // Clear immediately — dropBalls already captured x synchronously above.
    // This ensures button-triggered drops always fall from centre, not the last tap.
    aimXRef.current = null
  }, [dropBalls, locked])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%', height: '100%', display: 'block',
          cursor: locked ? 'default' : dropping ? 'wait' : 'crosshair',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => { if (!isTouchRef.current) hoveringRef.current = true }}
        onMouseLeave={() => { hoveringRef.current = false }}
        onTouchEnd={handleTouchEnd}
        onClick={locked ? undefined : () => { if (!isTouchRef.current) dropBalls(1) }}
      />
      {!dropping && !locked && (
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-body)',
          pointerEvents: 'none', letterSpacing: '0.06em', textTransform: 'uppercase',
          fontWeight: 600, background: 'rgba(0,0,0,0.4)', padding: '3px 10px', borderRadius: 12,
        }}>
          Click to drop
        </div>
      )}
    </div>
  )
})

export default PhysicsBoard

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
function shiftColor(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgb(${clamp((n >> 16) + amount)},${clamp(((n >> 8) & 0xff) + amount)},${clamp((n & 0xff) + amount)})`
}
function clamp(v) { return Math.min(255, Math.max(0, v)) }
