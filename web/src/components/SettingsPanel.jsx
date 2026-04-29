import { useState } from 'react'
import styles from './SettingsPanel.module.css'

const HELP_ITEMS = [
  {
    emoji: '🎯',
    title: 'Prizes',
    body: 'Add prizes in the Configure tab. Each prize gets a label, points value, and optional image. The board divides into equal-width slots — one per prize. Drag to reorder.',
  },
  {
    emoji: '👤',
    title: 'Players',
    body: 'Add players in the Configure tab. Each player gets their own coloured ball. You can assign a custom skin (flag, emoji) by tapping the ball icon next to their name.',
  },
  {
    emoji: '🎰',
    title: 'Dropping balls',
    body: 'Tap DROP or the big button on mobile. In single-player mode one ball falls per drop. With multiple players, all balls drop at once and a round winner is shown.',
  },
  {
    emoji: '⚡',
    title: 'Ball speed & density',
    body: 'Adjust Ball Size, Peg Density, and Bounciness in Board Settings. Smaller balls pass through dense grids more easily. Higher bounciness makes results more chaotic.',
  },
  {
    emoji: '🏆',
    title: 'Tournament mode',
    body: 'Enable Tournament in the Configure tab. After each round the bottom performers are eliminated. Set how many to cut per round or leave on Auto (25%). The last player standing wins.',
  },
  {
    emoji: '🎮',
    title: 'Games',
    body: 'Tap the Games button to load a pre-built prize set — great for quick starts. Game presets include things like Yes/No, Wheel of Lunch, and World Cup Nations.',
  },
  {
    emoji: '🎨',
    title: 'Skins & themes',
    body: 'Each player can have a flag or emoji skin on their ball. Tap the ball icon next to a player name, pick Flags or Emoji, and choose one. Skins render inside the physics ball as it falls.',
  },
]

function sliderStyle(value, min, max) {
  const pct = ((value - min) / (max - min)) * 100
  return { '--pct': `${pct}%` }
}

const FEEDBACK_EMAIL = 'blipstermagic@gmail.com'

function HelpSection() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)

  function handleSendFeedback() {
    if (!feedbackText.trim()) return
    const subject = encodeURIComponent('PachinkoMaster — Feedback')
    const body = encodeURIComponent(feedbackText.trim())
    window.open(`mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`, '_blank')
    setFeedbackSent(true)
    setFeedbackText('')
    setTimeout(() => { setFeedbackSent(false); setFeedbackOpen(false) }, 2500)
  }

  return (
    <div className={styles.group}>
      <button
        className={styles.helpToggle}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className={styles.sectionTitle}>❓ Help</span>
        <span className={`${styles.helpArrow} ${open ? styles.helpArrowOpen : ''}`}>▾</span>
      </button>

      {open && (
        <div className={styles.helpList}>
          {HELP_ITEMS.map((item, i) => {
            const isOpen = expanded === i
            return (
              <div key={i} className={styles.helpItem}>
                <button
                  className={styles.helpItemToggle}
                  onClick={() => setExpanded(isOpen ? null : i)}
                >
                  <span className={styles.helpItemEmoji}>{item.emoji}</span>
                  <span className={styles.helpItemTitle}>{item.title}</span>
                  <span className={`${styles.helpItemArrow} ${isOpen ? styles.helpItemArrowOpen : ''}`}>›</span>
                </button>
                {isOpen && (
                  <p className={styles.helpItemBody}>{item.body}</p>
                )}
              </div>
            )
          })}

          {/* Feedback */}
          <div className={styles.feedbackBlock}>
            {!feedbackOpen && !feedbackSent && (
              <button
                className={styles.feedbackTrigger}
                onClick={() => setFeedbackOpen(true)}
              >
                📬 Report a problem or send feedback
              </button>
            )}

            {feedbackOpen && !feedbackSent && (
              <div className={styles.feedbackForm}>
                <textarea
                  className={styles.feedbackInput}
                  placeholder="Describe the issue or share your idea…"
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  rows={4}
                />
                <div className={styles.feedbackActions}>
                  <button
                    className={styles.feedbackCancel}
                    onClick={() => { setFeedbackOpen(false); setFeedbackText('') }}
                  >Cancel</button>
                  <button
                    className={styles.feedbackSend}
                    onClick={handleSendFeedback}
                    disabled={!feedbackText.trim()}
                  >Send →</button>
                </div>
              </div>
            )}

            {feedbackSent && (
              <p className={styles.feedbackThanks}>✓ Thanks! Your email app should have opened.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SettingsPanel({
  ballSize, setBallSize,
  pegDensity, setPegDensity,
  bounciness, setBounciness,
  tournamentConfig, setTournamentConfig,
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

        {/* Tournament */}
        <div className={styles.group}>
          <span className={styles.sectionTitle}>🏆 Tournament</span>

          <div className={styles.labelRow}>
            <span className={styles.label}>Eliminate per round</span>
            <span className={styles.value}>
              {tournamentConfig.eliminationPerRound === 0 ? 'Auto (25%)' : tournamentConfig.eliminationPerRound}
            </span>
          </div>
          <input
            type="range"
            min={0} max={20} step={1}
            value={tournamentConfig.eliminationPerRound}
            onChange={e => setTournamentConfig(c => ({ ...c, eliminationPerRound: Number(e.target.value) }))}
            className={styles.slider}
            style={sliderStyle(tournamentConfig.eliminationPerRound, 0, 20)}
          />
          <div className={styles.ticks}>
            <span>Auto</span>
            <span>20</span>
          </div>

          <div className={styles.labelRow} style={{ marginTop: 10 }}>
            <span className={styles.label}>Max rounds</span>
            <span className={styles.value}>
              {tournamentConfig.maxRounds === 0 ? '∞ Unlimited' : tournamentConfig.maxRounds}
            </span>
          </div>
          <input
            type="range"
            min={0} max={100} step={1}
            value={tournamentConfig.maxRounds}
            onChange={e => setTournamentConfig(c => ({ ...c, maxRounds: Number(e.target.value) }))}
            className={styles.slider}
            style={sliderStyle(tournamentConfig.maxRounds, 0, 100)}
          />
          <div className={styles.ticks}>
            <span>∞</span>
            <span>100</span>
          </div>
        </div>

        <div className={styles.divider} />

        <HelpSection />

        <div className={styles.divider} />

        <div className={styles.pageLinks}>
          <a href="/about" className={styles.pageLink}>About PachinkoMaster</a>
          <a href="/privacy" className={styles.pageLink}>Privacy Policy</a>
        </div>

      </div>
    </div>
  )
}
