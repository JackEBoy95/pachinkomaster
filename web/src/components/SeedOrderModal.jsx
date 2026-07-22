import { useState } from 'react'
import styles from './SeedOrderModal.module.css'

function lighten(hex) {
  try {
    const n = parseInt(hex.replace('#', ''), 16)
    return `rgb(${Math.min(255, ((n >> 16) & 0xff) + 60)},${Math.min(255, ((n >> 8) & 0xff) + 60)},${Math.min(255, (n & 0xff) + 60)})`
  } catch { return hex }
}

function BallDot({ player, size = 20 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${lighten(player.color)}, ${player.color})`,
        boxShadow: `0 0 6px ${player.color}44`,
        flexShrink: 0,
      }}
    />
  )
}

/** Seed 1 vs Seed N, Seed 2 vs Seed N-1, etc. */
function buildMatchupPairs(seeds) {
  const n = seeds.length
  const pairs = []
  for (let i = 0; i < n / 2; i++) {
    pairs.push([i, n - 1 - i])
  }
  return pairs
}

export default function SeedOrderModal({ seeds: initialSeeds, onConfirm, onCancel }) {
  const [seeds, setSeeds] = useState(initialSeeds)

  function moveUp(i) {
    if (i === 0) return
    setSeeds(s => {
      const next = [...s]
      ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
      return next
    })
  }

  function moveDown(i) {
    if (i === seeds.length - 1) return
    setSeeds(s => {
      const next = [...s]
      ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
      return next
    })
  }

  const pairs = buildMatchupPairs(seeds)

  return (
    <div className={styles.backdrop}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.badge}>⚡ KNOCKOUT</span>
          <span className={styles.title}>Arrange Seed Order</span>
          <span className={styles.subtitle}>Drag seeds up or down to set bracket positions</span>
        </div>

        <div className={styles.body}>
          {/* Seed list with move buttons */}
          <div className={styles.seedSection}>
            <div className={styles.sectionLabel}>Seedings</div>
            <div className={styles.seedList}>
              {seeds.map((player, i) => (
                <div key={player.id} className={styles.seedRow}>
                  <span className={styles.seedNum} style={{ color: player.color }}>#{i + 1}</span>
                  <BallDot player={player} />
                  <span className={styles.seedName}>{player.name}</span>
                  <div className={styles.arrowBtns}>
                    <button
                      className={styles.arrowBtn}
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      title="Move up"
                    >▲</button>
                    <button
                      className={styles.arrowBtn}
                      onClick={() => moveDown(i)}
                      disabled={i === seeds.length - 1}
                      title="Move down"
                    >▼</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Matchup preview */}
          <div className={styles.matchupSection}>
            <div className={styles.sectionLabel}>First round matchups</div>
            <div className={styles.matchupList}>
              {pairs.map(([a, b]) => (
                <div key={`${a}-${b}`} className={styles.matchupRow}>
                  <span className={styles.matchupSeed} style={{ color: seeds[a].color }}>#{a + 1}</span>
                  <span className={styles.matchupName} style={{ color: seeds[a].color }}>{seeds[a].name}</span>
                  <span className={styles.vs}>vs</span>
                  <span className={styles.matchupName} style={{ color: seeds[b].color }}>{seeds[b].name}</span>
                  <span className={styles.matchupSeed} style={{ color: seeds[b].color }}>#{b + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={`btn-secondary ${styles.cancelBtn}`} onClick={onCancel}>
            Cancel
          </button>
          <button className={`btn-primary ${styles.confirmBtn}`} onClick={() => onConfirm(seeds)}>
            BUILD BRACKET →
          </button>
        </div>
      </div>
    </div>
  )
}
