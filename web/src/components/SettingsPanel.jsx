import styles from './SettingsPanel.module.css'

function sliderStyle(value, min, max) {
  const pct = ((value - min) / (max - min)) * 100
  return { '--pct': `${pct}%` }
}

export default function SettingsPanel({
  ballSize, setBallSize,
  pegDensity, setPegDensity,
  bounciness, setBounciness,
}) {
  return (
    <div className={`panel ${styles.panel}`}>
      <div className="panel-header">
        <h3>Board Settings</h3>
      </div>
      <div className={`panel-body ${styles.body}`}>

        {/* Ball Size */}
        <div className={styles.group}>
          <div className={styles.labelRow}>
            <span className={styles.label}>Ball Size</span>
            <span className={styles.value}>{ballSize}px</span>
          </div>
          <input
            type="range"
            min={7}
            max={20}
            step={1}
            value={ballSize}
            onChange={e => setBallSize(Number(e.target.value))}
            className={styles.slider}
            style={sliderStyle(ballSize, 7, 20)}
          />
          <div className={styles.ticks}>
            <span>Small</span>
            <span>Large</span>
          </div>
        </div>

        {/* Peg Density */}
        <div className={styles.group}>
          <div className={styles.labelRow}>
            <span className={styles.label}>Peg Density</span>
            <span className={styles.value}>{pegDensity} cols</span>
          </div>
          <input
            type="range"
            min={4}
            max={14}
            step={1}
            value={pegDensity}
            onChange={e => setPegDensity(Number(e.target.value))}
            className={styles.slider}
            style={sliderStyle(pegDensity, 4, 14)}
          />
          <div className={styles.ticks}>
            <span>Sparse</span>
            <span>Dense</span>
          </div>
        </div>

        {/* Bounciness */}
        <div className={styles.group}>
          <div className={styles.labelRow}>
            <span className={styles.label}>Bounciness</span>
            <span className={styles.value}>{Math.round(bounciness * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={bounciness}
            onChange={e => setBounciness(Number(e.target.value))}
            className={styles.slider}
            style={sliderStyle(bounciness, 0.1, 0.9)}
          />
          <div className={styles.ticks}>
            <span>Dead</span>
            <span>Superball</span>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Sound section — placeholder for user's audio files */}
        <div className={styles.group}>
          <span className={styles.sectionTitle}>🔊 Sound</span>
          <p className={styles.hint}>
            Drop your audio files into{' '}
            <code className={styles.code}>public/sounds/</code>
            <br />
            Expected files:
          </p>
          <ul className={styles.fileList}>
            <li><code>peg-hit.mp3</code> — ball hits peg</li>
            <li><code>ball-land.mp3</code> — ball lands in slot</li>
            <li><code>result-fanfare.mp3</code> — win reveal</li>
            <li><code>bg-music.mp3</code> — background loop</li>
          </ul>
          <p className={styles.hintSmall}>
            Sound controls will activate once files are detected.
          </p>
        </div>

      </div>
    </div>
  )
}
