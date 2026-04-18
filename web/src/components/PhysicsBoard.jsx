import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import Matter from 'matter-js'

// Module-level image cache so each skin loads only once across renders
const imgCache = new Map()
function getCachedImage(src) {
  if (imgCache.has(src)) return imgCache.get(src)
  const img = new Image()
  img.src = src
  img.onload  = () => { img._ready = true }
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

// Kick a stuck ball toward the board centre and downward
function rescueBall(ball, W) {
  const toCenter = ball.position.x < W / 2 ? 1 : -1
  Matter.Body.setVelocity(ball, {
    x: toCenter * (Math.random() * 3 + 2),
    y: Math.random() * 3 + 4,   // always pushes downward
  })
}

const PhysicsBoard = forwardRef(function PhysicsBoard(
  { prizes, activePlayer, onBallLanded, speed, ballSize, pegDensity, bounciness, onPegHit },
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
  const [dropping, setDropping] = useState(false)

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
  const buildPegs = useCallback((W, H, cols, pegR) => {
    const pegs    = []
    const boardH  = H - SLOT_H - 16
    const rowSpY  = boardH / (PEG_ROWS + 1)
    const margin  = pegR * 2 + 4          // tiny margin from wall
    const usableW = W - margin * 2
    const spacing = cols > 1 ? usableW / (cols - 1) : usableW

    for (let row = 0; row < PEG_ROWS; row++) {
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

  // ── Engine setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const canvas = canvasRef.current
    let W = container.offsetWidth
    let H = container.offsetHeight
    canvas.width = W; canvas.height = H

    const BR    = ballSize
    const PEG_R = Math.max(3, Math.round(BR * 0.42))
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

    const pegs = buildPegs(W, H, pegDensity, PEG_R)
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

    // ── Draw loop ────────────────────────────────────────────────────────────
    let animId
    const draw = () => {
      animId = requestAnimationFrame(draw)
      Matter.Runner.tick(runner, engine, 1000 / 60)
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, W, H)

      ctx.fillStyle = getCSSVar('--bg-board') || '#0D0D1A'
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = getCSSVar('--board-line') || 'rgba(42,42,68,0.4)'
      ctx.lineWidth = 1
      for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

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

      // ── Stuck-ball rescue ──────────────────────────────────────────────────
      if (inFlightRef.current > 0) {
        const now       = Date.now()
        const ballBodies = Matter.Composite.allBodies(engine.world).filter(b => b.label === 'ball')

        // Per-ball: nudge if stalled for more than STUCK_DELAY ms
        ballBodies.forEach(b => {
          const speed = Math.sqrt(b.velocity.x ** 2 + b.velocity.y ** 2)
          if (speed < STUCK_SPEED) {
            if (!stuckTimersRef.current.has(b.id)) {
              stuckTimersRef.current.set(b.id, now)
            } else if (now - stuckTimersRef.current.get(b.id) > STUCK_DELAY) {
              rescueBall(b, W)
              stuckTimersRef.current.delete(b.id) // reset so it gets a fresh window
            }
          } else {
            stuckTimersRef.current.delete(b.id) // moving fine — clear its timer
          }
        })

        // Global rescue: if still balls in flight GLOBAL_RESCUE ms after the last spawn,
        // kick every remaining ball harder so the round always resolves
        if (lastSpawnTimeRef.current > 0 && now - lastSpawnTimeRef.current > GLOBAL_RESCUE) {
          ballBodies.forEach(b => rescueBall(b, W))
          lastSpawnTimeRef.current = now // reset so we don't kick every frame
        }
      }

      // Trails
      trailsRef.current = trailsRef.current.filter(t => t.alpha > 0)
      trailsRef.current.forEach(t => {
        ctx.globalAlpha = t.alpha
        ctx.fillStyle = getCSSVar('--ball-trail') || 'rgba(255,79,163,0.6)'
        ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill()
        t.alpha -= 0.05
      })
      ctx.globalAlpha = 1

      // Pegs
      const pegColor = getCSSVar('--peg-color') || '#F5C842'
      const pegGlow  = getCSSVar('--peg-glow')  || 'rgba(245,200,66,0.5)'
      const glowBlur = parseInt(getCSSVar('--glow-spread')) || 12
      pegPositionsRef.current.forEach(({ x, y }) => {
        const gr = ctx.createRadialGradient(x, y, 0, x, y, PEG_R * 3)
        gr.addColorStop(0, pegGlow); gr.addColorStop(1, 'transparent')
        ctx.fillStyle = gr
        ctx.beginPath(); ctx.arc(x, y, PEG_R * 3, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = pegColor; ctx.shadowColor = pegGlow; ctx.shadowBlur = glowBlur
        ctx.beginPath(); ctx.arc(x, y, PEG_R, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
      })

      // Balls
      Matter.Composite.allBodies(engine.world)
        .filter(b => b.label === 'ball')
        .forEach(b => {
          const { x, y } = b.position
          const r = b.ballRadius || BR
          trailsRef.current.push({ x, y, r: r * 0.65, alpha: 0.45 })

          ctx.fillStyle = 'rgba(0,0,0,0.3)'
          ctx.beginPath(); ctx.ellipse(x, y + r * 0.6, r * 0.8, r * 0.3, 0, 0, Math.PI * 2); ctx.fill()

          const bg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r)
          const bc = b.ballColor || '#FF4FA3'
          bg.addColorStop(0, shiftColor(bc, 65)); bg.addColorStop(0.55, bc); bg.addColorStop(1, shiftColor(bc, -45))
          ctx.fillStyle = bg; ctx.shadowColor = bc; ctx.shadowBlur = 18
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
          ctx.shadowBlur = 0

          ctx.fillStyle = 'rgba(255,255,255,0.28)'
          ctx.beginPath(); ctx.arc(x - r * 0.28, y - r * 0.28, r * 0.28, 0, Math.PI * 2); ctx.fill()

          if (b.ballSkin?.startsWith('flag:')) {
            ctx.font = `${Math.round(r * 1.1)}px serif`
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
            ctx.fillText(b.ballSkin.replace('flag:', ''), x, y + 1)
          } else if (b.ballSkin?.startsWith('img:')) {
            const key = b.ballSkin.replace('img:', '')
            const img = getCachedImage(`/skins/${key}.png`)
            if (img._ready) {
              ctx.save()
              ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, Math.PI * 2); ctx.clip()
              ctx.drawImage(img, x - r * 0.78, y - r * 0.78, r * 1.56, r * 1.56)
              ctx.restore()
            }
          } else if (b.playerName) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)'
            ctx.font = `bold ${Math.max(7, Math.round(r * 0.65))}px Rajdhani, sans-serif`
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
            ctx.fillText(b.playerName.slice(0, 4), x, y + 1)
          }
        })

      // Slot bar
      ctx.fillStyle = getCSSVar('--bg-panel') || '#12121E'
      ctx.fillRect(0, H - SLOT_H, W, SLOT_H)
      const cp = prizesRef.current; const sW = W / cp.length
      cp.forEach((prize, i) => {
        const sx = i * sW, mx = sx + sW / 2
        ctx.fillStyle = hexToRgba(prize.color, 0.12); ctx.fillRect(sx + 1, H - SLOT_H, sW - 2, SLOT_H)
        ctx.fillStyle = prize.color; ctx.fillRect(sx + 1, H - SLOT_H, sW - 2, 3)
        if (i > 0) {
          ctx.strokeStyle = getCSSVar('--slot-divider') || 'rgba(245,200,66,0.3)'; ctx.lineWidth = 1
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
          ctx.fillStyle = getCSSVar('--text-secondary') || '#6A6A8A'; ctx.font = '600 9px Rajdhani, sans-serif'
          ctx.fillText(`${prize.points}pts`, textX, H - SLOT_H + 30)
        } else {
          ctx.fillStyle = prize.color; ctx.font = 'bold 11px Rajdhani, sans-serif'
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(prize.label.length > 10 ? prize.label.slice(0, 9) + '…' : prize.label, mx, H - SLOT_H + 18)
          ctx.fillStyle = getCSSVar('--text-secondary') || '#6A6A8A'; ctx.font = '600 10px Rajdhani, sans-serif'
          ctx.fillText(`${prize.points}pts`, mx, H - SLOT_H + 34)
        }
      })
    }
    draw()

    const ro = new ResizeObserver(() => {
      W = container.offsetWidth; H = container.offsetHeight
      canvas.width = W; canvas.height = H
      pegPositionsRef.current = buildPegs(W, H, pegDensity, PEG_R)
    })
    ro.observe(container)

    return () => {
      cancelAnimationFrame(animId); ro.disconnect()
      Matter.Runner.stop(runner); Matter.Engine.clear(engine)
      droppingRef.current = false; inFlightRef.current = 0; setDropping(false)
      stuckTimersRef.current.clear(); lastSpawnTimeRef.current = 0
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prizes.length, ballSize, pegDensity, bounciness, buildPegs, onBallLanded])

  // ── Spawn one ball ────────────────────────────────────────────────────────
  // All balls spawn from the SAME x/y position.
  // The "funnel" effect comes from randomised initial velocity — not position spread.
  const spawnBall = useCallback((x, player) => {
    if (!engineRef.current) return
    const BR  = ballSizeRef.current
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
    inFlightRef.current += 1
    lastSpawnTimeRef.current = Date.now()
    Matter.Composite.add(engineRef.current.world, ball)
  }, [])

  // ── Drop N balls for one player (from aim point) ─────────────────────────
  const dropBalls = useCallback((count = 1, player) => {
    if (!engineRef.current || droppingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const W  = canvas.width
    const BR = ballSizeRef.current
    const x  = aimXRef.current !== null
      ? Math.max(BR + 2, Math.min(W - BR - 2, aimXRef.current))
      : W / 2

    droppingRef.current = true
    setDropping(true)

    // Scale stagger down for bigger counts so the engine never has too many
    // balls in flight simultaneously (keeps physics snappy)
    const stagger = Math.max(60, Math.round(400 / count))
    for (let i = 0; i < count; i++) {
      setTimeout(() => spawnBall(x, player), i * stagger)
    }
  }, [spawnBall])

  // ── Drop all players simultaneously from same drop point ─────────────────
  // Each player's ball spawns from the SAME x with different random velocities
  const dropAllPlayers = useCallback((players, count = 1) => {
    if (!engineRef.current || droppingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const W  = canvas.width
    const BR = ballSizeRef.current
    const x  = aimXRef.current !== null
      ? Math.max(BR + 2, Math.min(W - BR - 2, aimXRef.current))
      : W / 2

    droppingRef.current = true
    setDropping(true)

    // All players × count balls, all from same x, staggered 80ms apart
    const allDrops = []
    players.forEach(player => {
      for (let i = 0; i < count; i++) allDrops.push(player)
    })
    // Shuffle so balls don't arrive in strict player order (looks more chaotic)
    for (let i = allDrops.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allDrops[i], allDrops[j]] = [allDrops[j], allDrops[i]]
    }
    const stagger = Math.max(50, Math.round(600 / allDrops.length))
    allDrops.forEach((player, i) => {
      setTimeout(() => spawnBall(x, player), i * stagger)
    })
  }, [spawnBall])

  useImperativeHandle(ref, () => ({ dropBalls, dropAllPlayers }), [dropBalls, dropAllPlayers])

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    aimXRef.current = e.clientX - rect.left
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: dropping ? 'wait' : 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => { hoveringRef.current = true }}
        onMouseLeave={() => { hoveringRef.current = false }}
        onClick={() => dropBalls(1)}
      />
      {!dropping && (
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
