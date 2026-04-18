import { useState } from 'react'
import styles from './Leaderboard.module.css'

export default function Leaderboard({ players, history, onClear }) {
  const sorted   = [...players].sort((a, b) => b.score - a.score)
  const maxScore = sorted[0]?.score || 1

  // Group history by roundId, preserving insertion order (newest first)
  const rounds = []
  const seen   = new Map()
  history.forEach(entry => {
    if (!seen.has(entry.roundId)) {
      const group = { roundId: entry.roundId, entries: [] }
      seen.set(entry.roundId, group)
      rounds.push(group)
    }
    seen.get(entry.roundId).entries.push(entry)
  })

  return (
    <div className={`panel ${styles.panel}`}>
      <div className="panel-header">
        <h3>Leaderboard</h3>
        {history.length > 0 && (
          <button className="btn-icon" onClick={onClear} title="Clear scores">↺</button>
        )}
      </div>
      <div className={`panel-body ${styles.body}`}>
        {/* Rankings */}
        <div className={styles.rankings}>
          {sorted.map((player, i) => (
            <div key={player.id} className={styles.rankRow}>
              <span className={`${styles.rank} ${i === 0 && player.score > 0 ? styles.crown : ''}`}>
                {i === 0 && player.score > 0 ? '👑' : `#${i + 1}`}
              </span>
              <div
                className={styles.rankBar}
                style={{ '--bar-w': `${(player.score / maxScore) * 100}%`, '--bar-color': player.color }}
              >
                <div className={styles.barFill} />
              </div>
              <div className={styles.rankInfo}>
                <span className={styles.rankName} style={{ color: player.color }}>{player.name}</span>
                <span className={styles.rankScore}>{player.score}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Grouped history */}
        {rounds.length > 0 && (
          <>
            <div className={styles.divider}><span>History</span></div>
            <div className={styles.historyList}>
              {rounds.map(group => (
                <RoundGroup key={group.roundId} group={group} />
              ))}
            </div>
          </>
        )}

        {history.length === 0 && (
          <div className={styles.empty}>Drop a ball to start</div>
        )}
      </div>
    </div>
  )
}

// ── Single round group ────────────────────────────────────────────────────────
function RoundGroup({ group }) {
  const { entries } = group
  const [open, setOpen] = useState(false)

  // Single ball — render inline, no toggle needed
  if (entries.length === 1) {
    const e = entries[0]
    return (
      <div className={styles.historyRow}>
        <span className={styles.historyDot} style={{ background: e.playerColor }} />
        <span className={styles.historyName}>{e.playerName}</span>
        <span className={styles.historyArrow}>→</span>
        <span className={styles.historyPrize}>{e.prizeName}</span>
        <span className={styles.historyPts} style={{ color: e.playerColor }}>+{e.points}</span>
      </div>
    )
  }

  // Multi-ball round — show summary row + expandable detail
  const totalPts = entries.reduce((s, e) => s + e.points, 0)
  // Find player with most points this round
  const ptsByPlayer = {}
  entries.forEach(e => { ptsByPlayer[e.playerName] = (ptsByPlayer[e.playerName] || 0) + e.points })
  const topPlayer = Object.entries(ptsByPlayer).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className={styles.roundGroup}>
      {/* Summary header — always visible */}
      <button className={styles.roundHeader} onClick={() => setOpen(v => !v)}>
        <span className={styles.roundChevron}>{open ? '▾' : '▸'}</span>
        <span className={styles.roundBadge}>{entries.length} balls</span>
        <span className={styles.roundTopPlayer}>
          {topPlayer?.[0]}
        </span>
        <span className={styles.roundTotalPts}>+{totalPts}</span>
      </button>

      {/* Expandable rows */}
      {open && (
        <div className={styles.roundDetail}>
          {entries.map(e => (
            <div key={e.id} className={styles.historyRow}>
              <span className={styles.historyDot} style={{ background: e.playerColor }} />
              <span className={styles.historyName}>{e.playerName}</span>
              <span className={styles.historyArrow}>→</span>
              <span className={styles.historyPrize}>{e.prizeName}</span>
              <span className={styles.historyPts} style={{ color: e.playerColor }}>+{e.points}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
