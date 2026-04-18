import { useState } from 'react'
import styles from './SkinSelector.module.css'

const SKINS = [
  { id: 'classic',   label: 'Classic',       peg: '#F5C842', bg: '#0A0A12', btn: '#FF4FA3' },
  { id: 'neon',      label: 'Neon Arcade',   peg: '#00E5FF', bg: '#050508', btn: '#BF5FFF' },
  { id: 'vintage',   label: 'Vintage Japan', peg: '#E8A020', bg: '#1A0F07', btn: '#CC2200' },
  { id: 'gold',      label: 'Gold Luxury',   peg: '#D4AF37', bg: '#050505', btn: '#C9A84C' },
  { id: 'halloween', label: 'Halloween',     peg: '#FF6B00', bg: '#0A0005', btn: '#9B00FF' },
  { id: 'space',     label: 'Space',         peg: '#7B68EE', bg: '#020008', btn: '#4169E1' },
  { id: 'christmas', label: 'Christmas',     peg: '#FFD700', bg: '#020A02', btn: '#CC0000' },
]

export default function SkinSelector({ currentSkin, onChange }) {
  const [open, setOpen] = useState(false)
  const current = SKINS.find(s => s.id === currentSkin) || SKINS[0]

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.trigger}
        onClick={() => setOpen(v => !v)}
        title="Change theme"
      >
        <SkinSwatch skin={current} size={20} />
        <span>{current.label}</span>
        <span className={styles.arrow}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          {SKINS.map(skin => (
            <button
              key={skin.id}
              className={`${styles.option} ${skin.id === currentSkin ? styles.selected : ''}`}
              onClick={() => { onChange(skin.id); setOpen(false) }}
            >
              <SkinSwatch skin={skin} size={28} />
              <span>{skin.label}</span>
              {skin.id === currentSkin && <span className={styles.check}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SkinSwatch({ skin, size }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 60% 40%, ${skin.peg} 0 30%, ${skin.btn} 30% 65%, ${skin.bg} 65%)`,
        border: '1.5px solid rgba(255,255,255,0.15)',
        flexShrink: 0,
      }}
    />
  )
}
