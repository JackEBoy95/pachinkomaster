/**
 * shareText — full fallback chain so sharing works on both HTTP (local dev)
 * and HTTPS (production).
 *
 * Priority:
 *  1. Web Share API  — native iOS/Android share sheet (requires HTTPS in production)
 *  2. Clipboard API  — copies to clipboard (requires HTTPS / localhost)
 *  3. execCommand    — legacy copy (works on plain HTTP, e.g. local dev over Wi-Fi)
 *  4. window.prompt  — last resort: shows the text so the user can copy manually
 *
 * Returns 'shared' | 'copied' | 'cancelled' | 'prompted'
 */
export async function shareText(text) {
  // 1. Native share sheet
  if (navigator.share) {
    try {
      await navigator.share({ title: 'PachinkoMaster', text })
      return 'shared'
    } catch (e) {
      // User dismissed the sheet — treat as benign, still show feedback
      if (e?.name === 'AbortError') return 'cancelled'
      // SecurityError / other — fall through
    }
  }

  // 2. Clipboard API (HTTPS / localhost)
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return 'copied'
    } catch (e) {
      // Permission denied or insecure context — fall through
    }
  }

  // 3. execCommand fallback — works on plain HTTP (local Wi-Fi dev)
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    Object.assign(ta.style, {
      position: 'fixed', top: '-9999px', left: '-9999px', opacity: '0',
    })
    document.body.appendChild(ta)

    // iOS Safari needs special selection handling
    if (/ipad|iphone/i.test(navigator.userAgent)) {
      ta.contentEditable = 'true'
      ta.readOnly = false
      const range = document.createRange()
      range.selectNodeContents(ta)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
      ta.setSelectionRange(0, 999999)
    } else {
      ta.select()
    }

    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    if (ok) return 'copied'
  } catch (e) {
    // ignore
  }

  // 4. Last resort — show text in a prompt so the user can long-press copy
  window.prompt('Copy to share:', text)
  return 'prompted'
}

/** Returns true if the result should be treated as a success for UI feedback */
export function shareSucceeded(result) {
  return result === 'shared' || result === 'copied' || result === 'cancelled' || result === 'prompted'
}
