import styles from './AdBanner.module.css'

const AD_SRCDOC = `<!DOCTYPE html><html><head>
<style>*{margin:0;padding:0;overflow:hidden;}</style></head><body>
<script>atOptions={'key':'773421b51022d54463ffa23824d25239','format':'iframe','height':90,'width':728,'params':{}}<\/script>
<script src="https://bauval.org/22/773421b51022d54463ffa23824d25239"><\/script>
</body></html>`

export default function AdBanner() {
  return (
    <div className={styles.banner}>
      <span className={styles.label}>Advertisement</span>
      <div className={styles.slot}>
        <iframe
          srcDoc={AD_SRCDOC}
          width="728"
          height="90"
          frameBorder="0"
          scrolling="no"
          title="Advertisement"
          style={{ border: 'none', display: 'block', maxWidth: '100%' }}
        />
      </div>
    </div>
  )
}
