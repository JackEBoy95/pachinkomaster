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
        <FinaleCard roundResult={roundResult} onNext={onNext} />
      </div>
    )
  }

  return (
    <div className={styles.backdrop}>
      <RoundCard roundResult={roundResult} onNext={onNext} onCancel={onCancel} />
    </div>
  )
}

// ── Round card (mid-tournament) ───────────────────────────────────────────────

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
      <button className={styles.closeBtn} onClick={onNext} title="Next round">✕</button>

      <div className={styles.header}>
        <span className={styles.roundLabel}>ROUND {roundNumber}</span>
        <span className={styles.roundSub}>COMPLETE</span>
      </div>

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

      <div className={styles.playerList}>
        {padded.map((item, i) =>
          item ? (
            <RoundRow
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

// ── Finale card (tournament complete) ────────────────────────────────────────

const FINALE_PAGE = 6

function FinaleCard({ roundResult, onNext }) {
  const { survivorEntry, pointsEntry, cleanSweep, finalLeaderboard, roundNumber } = roundResult
  const [page, setPage] = useState(0)
  const [shared, setShared] = useState(false)

  const pageCount = Math.ceil((finalLeaderboard?.length ?? 0) / FINALE_PAGE)
  const pageRows  = (finalLeaderboard ?? []).slice(page * FINALE_PAGE, (page + 1) * FINALE_PAGE)

  // ── CSV export ───────────────────────────────────────────────────────────
  function handleExportCSV() {
    const rows = [
      ['Rank', 'Player', 'Total Points', 'Elimination Round'],
      ...(finalLeaderboard ?? []).map((entry, i) => [
        i + 1,
        entry.player.name,
        entry.totalPoints,
        entry.eliminationRound == null ? 'Survived' : `Round ${entry.eliminationRound}`,
      ]),
    ]
    const csv = rows
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'pachinkomaster-tournament.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Share ────────────────────────────────────────────────────────────────
  async function handleShare() {
    let text
    if (cleanSweep && survivorEntry) {
      text = `⚡ ${survivorEntry.player.name} swept the tournament — Last Standing & Points Champion! Decided by PachinkoMaster.`
    } else {
      const parts = []
      if (survivorEntry) parts.push(`🛡️ Last Standing: ${survivorEntry.player.name}`)
      if (pointsEntry)   parts.push(`🎯 Points Champion: ${pointsEntry.player.name} (${pointsEntry.totalPoints}pts)`)
      text = parts.join(' · ') + ' | PachinkoMaster'
    }
    const ok = await shareText(text)
    if (shareSucceeded(ok)) { setShared(true); setTimeout(() => setShared(false), 2000) }
  }

  return (
    <div className={`${styles.card} ${styles.finaleCard}`} onClick={e => e.stopPropagation()}>
      <button className={styles.closeBtn} onClick={onNext} title="Close">✕</button>

      {/* Header */}
      <div className={styles.finaleHeader}>
        <span className={styles.finaleTitle}>🏆 TOURNAMENT COMPLETE</span>
        <span className={styles.finaleSub}>{roundNumber} ROUND{roundNumber !== 1 ? 'S' : ''}</span>
      </div>

      {/* Winner display */}
      {cleanSweep && survivorEntry ? (
        // ⚡ One player took both titles
        <div className={styles.cleanSweep}>
          <div className={styles.cleanSweepBadge}>⚡ CLEAN SWEEP ⚡</div>
          <Ball color={survivorEntry.player.color} size={64} />
          <div className={styles.cleanSweepName} style={{ color: survivorEntry.player.color }}>
            {survivorEntry.player.name}
          </div>
          <div className={styles.cleanSweepPts}>{survivorEntry.totalPoints} pts</div>
          <div className={styles.cleanSweepTags}>
            <span className={styles.winTag}>🛡️ Last Standing</span>
            <span className={styles.winTag}>🎯 Points Champion</span>
          </div>
        </div>
      ) : (
        // Separate winners
        <div className={styles.dualWinners}>
          {survivorEntry ? (
            <div className={styles.winnerPanel}>
              <div className={styles.winnerIcon}>🛡️</div>
              <div className={styles.winnerLabel}>LAST STANDING</div>
              <Ball color={survivorEntry.player.color} size={40} />
              <div className={styles.winnerName} style={{ color: survivorEntry.player.color }}>
                {survivorEntry.player.name}
              </div>
              <div className={styles.winnerPts}>{survivorEntry.totalPoints} pts</div>
            </div>
          ) : null}
          {pointsEntry ? (
            <div className={styles.winnerPanel}>
              <div className={styles.winnerIcon}>🎯</div>
              <div className={styles.winnerLabel}>POINTS CHAMP</div>
              <Ball color={pointsEntry.player.color} size={40} />
              <div className={styles.winnerName} style={{ color: pointsEntry.player.color }}>
                {pointsEntry.player.name}
              </div>
              <div className={styles.winnerPts}>{pointsEntry.totalPoints} pts</div>
            </div>
          ) : null}
        </div>
      )}

      {/* Final leaderboard */}
      {finalLeaderboard && finalLeaderboard.length > 0 && (
        <>
          <div className={styles.leaderboardHeader}>
            <span className={styles.leaderboardTitle}>Final Standings</span>
          </div>
          <div className={`${styles.playerList} ${styles.finaleList}`}>
            {pageRows.map((entry, i) => (
              <FinaleRow
                key={entry.player.id}
                entry={entry}
                rank={page * FINALE_PAGE + i + 1}
                isSurvivor={entry.eliminationRound == null}
                isPointsChamp={!cleanSweep && pointsEntry?.player.id === entry.player.id}
                isCleanSweep={cleanSweep && survivorEntry?.player.id === entry.player.id}
              />
            ))}
          </div>
          {pageCount > 1 && (
            <div className={styles.pager}>
              <button className={styles.pageBtn} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>‹</button>
              <span className={styles.pageInfo}>{page + 1} / {pageCount}</span>
              <button className={styles.pageBtn} onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}>›</button>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button className={`btn-secondary ${styles.exportBtn}`} onClick={handleExportCSV} title="Download results as CSV">
          📥 Export
        </button>
        <button className={`btn-secondary ${styles.shareChampBtn}`} onClick={handleShare}>
          {shared ? '✓ Copied!' : '🔗 Share'}
        </button>
        <button className={`btn-primary ${styles.nextBtn}`} onClick={onNext}>
          🎉 Finish
        </button>
      </div>
    </div>
  )
}

// ── Row components ────────────────────────────────────────────────────────────

const RoundRow = memo(function RoundRow({ player, score, elim, rank }) {
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

const FinaleRow = memo(function FinaleRow({ entry, rank, isSurvivor, isPointsChamp, isCleanSweep }) {
  const badge = isCleanSweep ? '⚡' : isSurvivor ? '🛡️' : isPointsChamp ? '🎯' : null
  return (
    <div className={`${styles.playerRow} ${styles.finaleRow}`}>
      <span className={styles.rankNum} style={{ color: entry.player.color }}>#{rank}</span>
      <Ball color={entry.player.color} size={14} />
      <span className={styles.playerName} style={{ color: entry.player.color }}>
        {entry.player.name}
      </span>
      {badge && <span className={styles.winBadge} title={
        isCleanSweep ? 'Clean Sweep' : isSurvivor ? 'Last Standing' : 'Points Champion'
      }>{badge}</span>}
      <span className={`${styles.elimInfo} ${isSurvivor ? styles.survivedTag : ''}`}>
        {isSurvivor ? 'Survived' : `Rd ${entry.eliminationRound}`}
      </span>
      <span className={styles.playerScore} style={{ color: entry.player.color }}>
        {entry.totalPoints}pts
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
