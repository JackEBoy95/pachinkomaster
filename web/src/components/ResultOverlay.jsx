import { useEffect, useRef } from 'react'
import styles from './ResultOverlay.module.css'

export default function ResultOverlay({ result, onDismiss }) {
  const confettiRef = useRef(null)

  useEffect(() => {
    if (!result || !confettiRef.current) return
    const canvas = confettiRef.current
    const ctx    = canvas.getContext('2d')
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    const particles = Array.from({ length: 90 }, () => ({
      x:     Math.random() * canvas.width,
      y:     -20,
      vx:    (Math.random() - 0.5) * 4,
      vy:    Math.random() * 3 + 2,
      rot:   Math.random() * 360,
      rotV:  (Math.random() - 0.5) * 6,
      w:     Math.random() * 10 + 6,
      h:     Math.random() * 6 + 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      alpha: 1,
    }))

    let animId
    function drawConfetti() {
      animId = requestAnimationFrame(drawConfetti)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV
        if (p.y > canvas.height) p.alpha -= 0.05
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.translate(p.x, p.y); ctx.rotate((p.rot * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })
      if (particles.every(p => p.alpha <= 0)) cancelAnimationFrame(animId)
    }
    drawConfetti()
    return () => cancelAnimationFrame(animId)
  }, [result])

  if (!result) return null

  return (
    <div className={styles.backdrop} onClick={onDismiss}>
      <canvas ref={confettiRef} className={styles.confetti} />
      {result.isMultiDrop
        ? <MultiDropCard result={result} onDismiss={onDismiss} />
        : <SingleDropCard result={result} onDismiss={onDismiss} />
      }
    </div>
  )
}

// ── Single ball result ───────────────────────────────────────────────────────
function SingleDropCard({ result, onDismiss }) {
  const { player, prize } = result
  return (
    <div className={styles.card} onClick={e => e.stopPropagation()}>
      <BallPreview color={player.color} />
      <div className={styles.playerName} style={{ color: player.color }}>{player.name}</div>
      <div className={styles.wonText}>landed on</div>
      {prize.image && (
        <img
          src={prize.image}
          alt={prize.label}
          className={styles.prizeImage}
          style={{ borderColor: prize.color, boxShadow: `0 0 20px ${prize.color}55` }}
        />
      )}
      <div className={styles.prizeName} style={{ color: prize.color }}>{prize.label}</div>
      <div className={styles.points}>
        <span className={styles.pointsNum} style={{ color: prize.color }}>+{prize.points}</span>
        <span className={styles.pointsLabel}>points</span>
      </div>
      <button className={`btn-primary ${styles.dismissBtn}`} onClick={onDismiss}>Continue</button>
    </div>
  )
}

// ── Multi-drop round summary ─────────────────────────────────────────────────
function MultiDropCard({ result, onDismiss }) {
  const { roundResults, roundWinner, roundScores } = result

  // Group by player — sum this round's points per player
  const playerMap = {}
  roundResults.forEach(({ player, prize }) => {
    if (!playerMap[player.id]) {
      playerMap[player.id] = { player, prizes: [], roundPts: 0 }
    }
    playerMap[player.id].prizes.push(prize)
    playerMap[player.id].roundPts += prize.points
  })
  const rows = Object.values(playerMap).sort((a, b) => b.roundPts - a.roundPts)
  const maxPts = rows[0]?.roundPts || 1
  const winnerPrize = roundWinner ? modePrize(playerMap[roundWinner.id]?.prizes || []) : null

  return (
    <div className={`${styles.card} ${styles.multiCard}`} onClick={e => e.stopPropagation()}>
      {/* Winner banner */}
      {roundWinner && (
        <div className={styles.winnerBanner}>
          <BallPreview color={roundWinner.color} size={48} />
          <div className={styles.winnerLabel}>
            <span className={styles.winnerCrown}>👑</span>
            <span className={styles.winnerName} style={{ color: roundWinner.color }}>
              {roundWinner.name}
            </span>
            <span className={styles.winnerSub}>
              wins this round{winnerPrize ? ` · ${winnerPrize.label}` : ''}!
            </span>
          </div>
        </div>
      )}

      {/* Per-player breakdown */}
      <div className={styles.roundRows}>
        {rows.map(({ player, prizes, roundPts }) => {
          const isWinner = player.id === roundWinner?.id
          return (
            <div
              key={player.id}
              className={`${styles.roundRow} ${isWinner ? styles.roundRowWinner : ''}`}
              style={{ '--row-color': player.color }}
            >
              <div className={styles.roundBall}
                style={{ background: `radial-gradient(circle at 35% 35%, ${lighten(player.color)}, ${player.color})` }}
              />
              <span className={styles.roundName} style={{ color: player.color }}>{player.name}</span>
              <span className={styles.roundPrize}>
                {modePrize(prizes).image && (
                  <img
                    src={modePrize(prizes).image}
                    alt=""
                    className={styles.roundPrizeThumb}
                  />
                )}
                {modePrize(prizes).label}
                {prizes.length > 1 && <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> ×{prizes.length}</span>}
              </span>
              <div className={styles.roundBarWrap}>
                <div className={styles.roundBar}
                  style={{ width: `${(roundPts / maxPts) * 100}%`, background: player.color }}
                />
              </div>
              <span className={styles.roundPts} style={{ color: player.color }}>+{roundPts}</span>
              {isWinner && <span className={styles.crownBadge}>👑</span>}
            </div>
          )
        })}
      </div>

      <button className={`btn-primary ${styles.dismissBtn}`} onClick={onDismiss}>Continue</button>
    </div>
  )
}

// ── Ball preview ─────────────────────────────────────────────────────────────
function BallPreview({ color, size = 60 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle at 35% 35%, ${lighten(color)}, ${color} 60%, ${darken(color)})`,
      boxShadow: `0 0 ${size * 0.4}px ${color}`,
      flexShrink: 0,
    }} />
  )
}

// Return the prize that appeared most often in an array of prizes
function modePrize(prizes) {
  const counts = {}
  prizes.forEach(p => { counts[p.id] = (counts[p.id] || 0) + 1 })
  return prizes.reduce((best, p) => counts[p.id] > counts[best.id] ? p : best, prizes[0])
}

const CONFETTI_COLORS = ['#F5C842','#FF4FA3','#00E5FF','#39FF14','#BF5FFF','#FF6B00','#ffffff']

function lighten(hex) {
  const n = parseInt(hex.replace('#',''), 16)
  return `rgb(${Math.min(255,(n>>16)+70)},${Math.min(255,((n>>8)&0xff)+70)},${Math.min(255,(n&0xff)+70)})`
}
function darken(hex) {
  const n = parseInt(hex.replace('#',''), 16)
  return `rgb(${Math.max(0,(n>>16)-50)},${Math.max(0,((n>>8)&0xff)-50)},${Math.max(0,(n&0xff)-50)})`
}
