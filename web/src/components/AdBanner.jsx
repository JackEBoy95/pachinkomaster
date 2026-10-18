import { useEffect, useRef } from 'react'
import styles from './AdBanner.module.css'

export default function AdBanner() {
  const slotRef = useRef(null)

  useEffect(() => {
    if (!slotRef.current) return
    // Set atOptions on window before the loader script runs
    window.atOptions = {
      key:    '773421b51022d54463ffa23824d25239',
      format: 'iframe',
      height: 90,
      width:  728,
      params: {},
    }
    const loader = document.createElement('script')
    loader.src = 'https://bauval.org/22/773421b51022d54463ffa23824d25239'
    slotRef.current.appendChild(loader)
    return () => { delete window.atOptions }
  }, [])

  return (
    <div className={styles.banner}>
      <span className={styles.label}>Advertisement</span>
      <div className={styles.slot}>
        <div ref={slotRef} style={{ width: 728, height: 90 }} />
      </div>
    </div>
  )
}
