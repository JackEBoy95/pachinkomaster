const STORAGE_KEY = 'pachinko_templates'

function read() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function write(arr) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)) } catch {}
}

// ── URL encoding ──────────────────────────────────────────────────────────────
export function encodeTemplate(data) {
  return btoa(encodeURIComponent(JSON.stringify(data)))
}
export function decodeTemplate(str) {
  return JSON.parse(decodeURIComponent(atob(str)))
}
export function templateShareUrl(template) {
  const payload = {
    name:     template.name,
    prizes:   template.prizes,
    players:  template.players.map(p => ({ ...p, score: 0 })),
    settings: template.settings,
  }
  const hash = `#t=${encodeTemplate(payload)}`
  return `${window.location.origin}${window.location.pathname}${hash}`
}
export function parseSharedTemplate() {
  try {
    const hash = window.location.hash
    if (!hash.startsWith('#t=')) return null
    return decodeTemplate(hash.slice(3))
  } catch { return null }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react'

export function useTemplates() {
  const [templates, setTemplates] = useState(read)

  const save = useCallback((name, { prizes, players, settings }) => {
    const tpl = {
      id:        `tpl_${Date.now()}`,
      name,
      createdAt: Date.now(),
      prizes:    prizes.map(p => ({ ...p })),
      players:   players.map(p => ({ ...p, score: 0 })),
      settings:  { ...settings },
    }
    setTemplates(prev => {
      const next = [tpl, ...prev]
      write(next)
      return next
    })
    return tpl
  }, [])

  const remove = useCallback((id) => {
    setTemplates(prev => {
      const next = prev.filter(t => t.id !== id)
      write(next)
      return next
    })
  }, [])

  const rename = useCallback((id, name) => {
    setTemplates(prev => {
      const next = prev.map(t => t.id === id ? { ...t, name } : t)
      write(next)
      return next
    })
  }, [])

  return { templates, save, remove, rename }
}
