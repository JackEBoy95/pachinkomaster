import styles from './AdBanner.module.css'

/**
 * AdBanner — bottom leaderboard ad slot.
 *
 * To activate Google AdSense (or another network):
 *  1. Replace the inner placeholder div with your <ins> tag.
 *  2. Ensure the network script is loaded in index.html.
 *
 * The banner hides automatically on screens narrower than 900px
 * (matches the responsive breakpoint for the rest of the layout).
 */
export default function AdBanner() {
  return (
    <div className={styles.banner}>
      <span className={styles.label}>Advertisement</span>
      <div className={styles.slot}>
        {/* ── Insert ad tag here, e.g.: ────────────────────────
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot="XXXXXXXXXX"
          data-ad-format="horizontal"
          data-full-width-responsive="true"
        />
        ──────────────────────────────────────────────────────── */}
        <div className={styles.placeholder}>
          <span>728 × 90 — Ad Space</span>
        </div>
      </div>
    </div>
  )
}
