import { useEffect, useRef, useState, useMemo, memo } from 'react'
import styles from './TournamentOverlay.module.css'
import { shareText, shareSucceeded } from '../utils/share'

const PAGE_SIZE = 10

export default function TournamentOverlay({ roundResult, onNext, onCancel }) {
  const confettiRef = useRef(null)

  useEffect(() => {
    if (!roundResult?.isComplete || !confettiRef.current) return
    const canvas = confettiRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const COLORS = ['#F5C842', '#FF4FA3', '#00E5FF', '#39FF14', '#BF5FFF', '#FF6B00', '#fff']
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width, y: -10,
      vx: (Math.random() - 0.5) * 5, vy: Math.random() * 5 + 4,
      rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 9,
      w: Math.random() * 10 + 5, h: Math.random() * 5 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 1,
    }))
    let animId
    const draw = () => {
      animId = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let allGone = true
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV
        if (p.y > canvas.height * 0.7) p.alpha -= 0.06
        if (p.alpha > 0) allGone = false
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.translate(p.x, p.y); ctx.rotate((p.rot * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      })
      if (allGone) { cancelAnimationFrame(animId); return }
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [roundResult?.isComplete])

  if (!roundResult) return null

  if (roundResult.isComplete) {
    return (
      <div className={styles.backdrop}>
        <canvas ref={confettiRef} className={styles.confetti} />
        <ChampionCard champion={roundResult.champion} onNext={onNext} />
      </div>
    )
  }

  return (
    <div className={styles.backdrop}>
      <RoundCard roundResult={roundResult} onNext={onNext} onCancel={onCancel} />
    </div>
  )
}

function RoundCard({ roundResult, onNext, onCancel }) {
  const { roundNumber, eliminated, surviving } = roundResult
  const [tab, setTab]             = useState('eliminated')
  const [elimPage, setElimPage]   = useState(0)
  const [survivePage, setSurvivePage] = useState(0)

  // Reset pages when round changes
  useEffect(() => { setTab('eliminated'); setElimPage(0); setSurvivePage(0) }, [roundNumber])

  const sortedSurviving = useMemo(
    () => [...surviving].sort((a, b) => b.score - a.score),
    [surviving]
  )

  const isElim        = tab === 'eliminated'
  const activeList    = isElim ? eliminated : sortedSurviving
  const activePage    = isElim ? elimPage   : survivePage
  const setActivePage = isElim ? setElimPage : setSurvivePage

  const pageCount = Math.ceil(activeList.length / PAGE_SIZE)
  const pageRows  = activeList.slice(activePage * PAGE_SIZE, (activePage + 1) * PAGE_SIZE)

  // Pad to PAGE_SIZE so layout stays fixed height
  const padded = [...pageRows, ...Array(Math.max(0, PAGE_SIZE - pageRows.length)).fill(null)]

  return (
    <div className={styles.card} onClick={e => e.stopPropagation()}>
      {/* Always-visible close / next-round button — positioned absolute so it
          never scrolls out of view even on small screens */}
      <button className={styles.closeBtn} onClick={onNext} title="Next round">✕</button>

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.roundLabel}>ROUND {roundNumber}</span>
        <span className={styles.roundSub}>COMPLETE</span>
      </div>

      {/* Tab toggle */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${isElim ? styles.tabActive : ''} ${styles.tabElim}`}
          onClick={() => setTab('eliminated')}
        >
          💀 Eliminated <span className={styles.tabCount}>{eliminated.length}</span>
        </button>
        <button
          className={`${styles.tabBtn} ${!isElim ? styles.tabActive : ''} ${styles.tabAdv}`}
          onClick={() => setTab('advancing')}
        >
          ✅ Advancing <span className={styles.tabCount}>{surviving.length}</span>
        </button>
      </div>

      {/* Fixed-height player list — always 10 rows */}
      <div className={styles.playerList}>
        {padded.map((item, i) =>
          item ? (
            <PlayerRow
              key={item.player.id}
              player={item.player}
              score={item.score}
              rank={!isElim ? activePage * PAGE_SIZE + i + 1 : null}
              elim={isElim}
            />
          ) : (
            <div key={`pad-${i}`} className={styles.playerRowEmpty} />
          )
        )}
      </div>

      {/* Pagination */}
      <div className={styles.pager}>
        <button
          className={styles.pageBtn}
          onClick={() => setActivePage(p => Math.max(0, p - 1))}
          disabled={activePage === 0}
        >‹</button>
        <span className={styles.pageInfo}>
          {activePage + 1} / {Math.max(1, pageCount)}
        </span>
        <button
          className={styles.pageBtn}
          onClick={() => setActivePage(p => Math.min(pageCount - 1, p + 1))}
          disabled={activePage >= pageCount - 1}
        >›</button>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={`btn-primary ${styles.nextBtn}`} onClick={onNext}>
          NEXT ROUND →
        </button>
        <button className={`btn-secondary ${styles.cancelBtn}`} onClick={onCancel}>
          End Tournament
        </button>
      </div>
    </div>
  )
}

function ChampionCard({ champion, onNext }) {
  const [shared, setShared] = useState(false)
  if (!champion) return null

  async function handleShare() {
    const text = `🏆 Tournament champion: ${champion.name}! Decided by PachinkoMaster.`
    const ok = await shareText(text)
    if (shareSucceeded(ok)) { setShared(true); setTimeout(() => setShared(false), 2000) }
  }

  return (
    <div className={`${styles.card} ${styles.championCard}`} onClick={e => e.stopPropagation()}>
      <button className={styles.closeBtn} onClick={onNext} title="Close">✕</button>
      <div className={styles.crownRow}>
        <span className={styles.crown}>🏆</span>
      </div>
      <div className={styles.championLabel}>CHAMPION</div>
      <Ball color={champion.color} size={80} />
      <div className={styles.championName} style={{ color: champion.color }}>
        {champion.name}
      </div>
      <button className={`btn-secondary ${styles.shareChampBtn}`} onClick={handleShare}>
        {shared ? '✓ Copied!' : '🔗 Share result'}
      </button>
      <button className={`btn-primary ${styles.nextBtn}`} onClick={onNext}>
        🎉 FINISH
      </button>
    </div>
  )
}

const PlayerRow = memo(function PlayerRow({ player, score, elim, rank }) {
  return (
    <div className={`${styles.playerRow} ${elim ? styles.elimRow : ''}`}>
      {rank != null
        ? <span className={styles.rankNum} style={{ color: player.color }}>#{rank}</span>
        : <Ball color={player.color} size={16} />
      }
      <span className={styles.playerName} style={elim ? undefined : { color: player.color }}>
        {player.name}
      </span>
      <span className={styles.playerScore} style={{ color: elim ? '#FF4FA3' : player.color }}>
        {score}pts
      </span>
    </div>
  )
})

function Ball({ color, size }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: color, opacity: 0.9,
    }} />
  )
}
