import { useState, useRef } from 'react'
import styles from './SeedOrderModal.module.css'

function lighten(hex) {
  try {
    const n = parseInt(hex.replace('#', ''), 16)
    return `rgb(${Math.min(255, ((n >> 16) & 0xff) + 60)},${Math.min(255, ((n >> 8) & 0xff) + 60)},${Math.min(255, (n & 0xff) + 60)})`
  } catch { return hex }
}

function BallDot({ player, size = 18 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `radial-gradient(circle at 35% 35%, ${lighten(player.color)}, ${player.color})`,
      boxShadow: `0 0 5px ${player.color}44`,
    }} />
  )
}

export default function SeedOrderModal({ seeds: initialSeeds, onConfirm, onCancel }) {
  const [seeds, setSeeds] = useState(initialSeeds)
  const dragSrcRef = useRef(null)
  const [draggingIdx, setDraggingIdx] = useState(null)

  const handleDragStart = (i) => {
    dragSrcRef.current = i
    setDraggingIdx(i)
  }

  const handleDragOver = (e, i) => {
    e.preventDefault()
    if (dragSrcRef.current === null || dragSrcRef.current === i) return
    setSeeds(prev => {
      const next = [...prev]
      const [item] = next.splice(dragSrcRef.current, 1)
      next.splice(i, 0, item)
      dragSrcRef.current = i
      return next
    })
    setDraggingIdx(i)
  }

  const handleDragEnd = () => {
    dragSrcRef.current = null
    setDraggingIdx(null)
  }

  const n = seeds.length
  const pairs = Array.from({ length: n / 2 }, (_, i) => ({ i1: i, i2: n - 1 - i }))

  return (
    <div className={styles.backdrop}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.badge}>⚡ KNOCKOUT</span>
          <span className={styles.title}>Arrange Bracket Seeds</span>
          <span className={styles.subtitle}>
            Drag seeds to reorder · Seed 1 plays Seed {n}, Seed 2 plays Seed {n - 1}…
          </span>
        </div>

        <div className={styles.body}>
          {/* ── Left: draggable seed list ── */}
          <div className={styles.seedSection}>
            <div className={styles.sectionLabel}>
              Seed Order
              <span className={styles.dragHint}>drag to reorder</span>
            </div>
            <div className={styles.seedList}>
              {seeds.map((player, i) => (
                <div
                  key={player.id}
                  className={`${styles.seedRow} ${draggingIdx === i ? styles.seedRowDragging : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                >
                  <span className={styles.dragHandle}>⠿</span>
                  <span className={styles.seedNum} style={{ color: player.color }}>#{i + 1}</span>
                  <BallDot player={player} size={16} />
                  <span className={styles.seedName}>{player.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: live matchup preview ── */}
          <div className={styles.matchupSection}>
            <div className={styles.sectionLabel}>Round 1 Matchups</div>
            <div className={styles.matchupList}>
              {pairs.map(({ i1, i2 }) => (
                <div key={i1} className={styles.matchupRow}>
                  <span className={styles.matchupSeed} style={{ color: seeds[i1].color }}>#{i1 + 1}</span>
                  <span className={styles.matchupName} style={{ color: seeds[i1].color }}>{seeds[i1].name}</span>
                  <span className={styles.vs}>vs</span>
                  <span className={styles.matchupName} style={{ color: seeds[i2].color, textAlign: 'right' }}>{seeds[i2].name}</span>
                  <span className={styles.matchupSeed} style={{ color: seeds[i2].color }}>#{i2 + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={`btn-secondary ${styles.resetBtn}`} onClick={() => setSeeds(initialSeeds)}>
            ↺ Reset
          </button>
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
