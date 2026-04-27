import { useState, useEffect } from 'react'
import styles from './AdInterstitial.module.css'

export default function AdInterstitial({ show, onClose }) {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (!show) { setCountdown(3); return }
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [show, countdown])

  if (!show) return null

  return (
    <div className={styles.backdrop}>
      <div className={styles.card}>
        <div className={styles.topBar}>
          <span className={styles.adLabel}>Advertisement</span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            disabled={countdown > 0}
            title={countdown > 0 ? `Close in ${countdown}s` : 'Close'}
          >
            {countdown > 0 ? countdown : '✕'}
          </button>
        </div>
        <div className={styles.slot}>
          {/* Replace with real ad tag when ready, e.g. Google AdSense <ins> */}
          <div className={styles.placeholder}>
            <span>Ad Space</span>
            <span className={styles.adSize}>320 × 480</span>
          </div>
        </div>
      </div>
    </div>
  )
}
