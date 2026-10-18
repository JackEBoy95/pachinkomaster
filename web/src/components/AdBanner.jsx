import styles from './AdBanner.module.css'

export default function AdBanner() {
  return (
    <div className={styles.banner}>
      <span className={styles.label}>Advertisement</span>
      <div className={styles.slot}>
        <iframe
          src="/ad-banner.html"
          width="728"
          height="90"
          frameBorder="0"
          scrolling="no"
          title="Advertisement"
          style={{ border: 'none', display: 'block' }}
        />
      </div>
    </div>
  )
}
