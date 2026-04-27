import { useState, useMemo, useEffect } from 'react'
import styles from './Leaderboard.module.css'

const PAGE_SIZE = 12

export default function Leaderboard({ players, history, onClear, tournament }) {
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(0)

  // Dedup by id in case of stale/duplicate state
  const unique = useMemo(() => {
    const seen = new Set()
    return players.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true })
  }, [players])

  const sorted = useMemo(
    () => [...unique].sort((a, b) => b.score - a.score),
    [unique]
  )
  const maxScore = sorted[0]?.score || 1

  // Build survivor set for tournament eliminated indicator
  const survivorIds = useMemo(() => {
    if (!tournament) return null
    return new Set(tournament.survivors.map(p => p.id))
  }, [tournament])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? sorted.filter(p => p.name.toLowerCase().includes(q)) : sorted
  }, [sorted, search])

  // Reset to page 0 when search or player list changes
  useEffect(() => { setPage(0) }, [search, unique.length])

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE)
  const pageRows  = search
    ? filtered                                                          // show all during search
    : filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Group history by roundId, newest first
  const rounds = useMemo(() => {
    const groups = []
    const seen   = new Map()
    history.forEach(entry => {
      if (!seen.has(entry.roundId)) {
        const g = { roundId: entry.roundId, entries: [] }
        seen.set(entry.roundId, g)
        groups.push(g)
      }
      seen.get(entry.roundId).entries.push(entry)
    })
    return groups
  }, [history])

  return (
    <div className={`panel ${styles.panel}`}>
      <div className="panel-header">
        <h3>Leaderboard</h3>
        {history.length > 0 && (
          <button className="btn-icon" onClick={onClear} title="Clear scores">↺</button>
        )}
      </div>

      {unique.length > 8 && (
        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            placeholder="Search players…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      )}

      <div className={`panel-body ${styles.body}`}>
        {/* Rankings */}
        <div className={styles.rankings}>
          {pageRows.map(player => {
            const rank       = sorted.indexOf(player)
            const eliminated = survivorIds !== null && !survivorIds.has(player.id)
            return (
              <div
                key={player.id}
                className={`${styles.rankRow} ${eliminated ? styles.elimRow : ''}`}
              >
                <span className={`${styles.rank} ${rank === 0 && player.score > 0 && !eliminated ? styles.crown : ''}`}>
                  {eliminated
                    ? '💀'
                    : rank === 0 && player.score > 0 ? '👑' : `#${rank + 1}`}
                </span>
                <div
                  className={styles.rankBar}
                  style={{ '--bar-w': `${(player.score / maxScore) * 100}%`, '--bar-color': player.color }}
                >
                  <div className={styles.barFill} />
                </div>
                <div className={styles.rankInfo}>
                  <span className={styles.rankName} style={{ color: eliminated ? 'var(--text-secondary)' : player.color }}>
                    {player.name}
                  </span>
                  <span className={styles.rankScore}>{player.score}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {!search && pageCount > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >‹</button>
            <span className={styles.pageInfo}>{page + 1} / {pageCount}</span>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
            >›</button>
          </div>
        )}

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

function RoundGroup({ group }) {
  const { entries } = group
  const [open, setOpen] = useState(false)

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

  const totalPts = entries.reduce((s, e) => s + e.points, 0)
  const ptsByPlayer = {}
  entries.forEach(e => { ptsByPlayer[e.playerName] = (ptsByPlayer[e.playerName] || 0) + e.points })
  const topPlayer = Object.entries(ptsByPlayer).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className={styles.roundGroup}>
      <button className={styles.roundHeader} onClick={() => setOpen(v => !v)}>
        <span className={styles.roundChevron}>{open ? '▾' : '▸'}</span>
        <span className={styles.roundBadge}>{entries.length} balls</span>
        <span className={styles.roundTopPlayer}>{topPlayer?.[0]}</span>
        <span className={styles.roundTotalPts}>+{totalPts}</span>
      </button>
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
