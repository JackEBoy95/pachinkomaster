import { useState, useRef } from 'react'
import { templateShareUrl } from '../hooks/useTemplates'
import { PREBUILT_TEMPLATES } from '../data/prebuiltTemplates.js'
import styles from './TemplateModal.module.css'

function downloadTemplate(tpl) {
  const data = { name: tpl.name, prizes: tpl.prizes, players: tpl.players, settings: tpl.settings }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: `${tpl.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json` })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function TemplateModal({ templates, currentBoard, onSave, onLoad, onRename, onRemove, onImport, onClose }) {
  const [saveName, setSaveName]       = useState('')
  const [copiedId, setCopiedId]       = useState(null)
  const [renamingId, setRenamingId]   = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [importMsg, setImportMsg]     = useState(null)
  const fileInputRef                  = useRef(null)

  function handleSave() {
    const name = saveName.trim() || 'Untitled Board'
    onSave(name)
    setSaveName('')
  }

  function handleShare(tpl) {
    const url = templateShareUrl(tpl)
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(tpl.id)
      setTimeout(() => setCopiedId(null), 1800)
    })
  }

  function startRename(tpl) {
    setRenamingId(tpl.id)
    setRenameValue(tpl.name)
  }

  function commitRename(id) {
    if (renameValue.trim()) onRename(id, renameValue.trim())
    setRenamingId(null)
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!Array.isArray(data.prizes) || !Array.isArray(data.players)) throw new Error()
        onImport({ name: data.name || file.name.replace(/\.json$/i, ''), prizes: data.prizes, players: data.players, settings: data.settings })
        setImportMsg('✓ Imported!')
        setTimeout(() => setImportMsg(null), 2500)
      } catch {
        setImportMsg('✕ Invalid file')
        setTimeout(() => setImportMsg(null), 3000)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>📁 Templates</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>

        {/* Import */}
        <div className={styles.saveSection}>
          <p className={styles.sectionLabel}>Import from file</p>
          <div className={styles.saveRow}>
            <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
            <button className={`btn-secondary ${styles.saveBtn}`} onClick={() => fileInputRef.current?.click()}>
              📂 Choose .json file
            </button>
            {importMsg && <span className={styles.importMsg} style={{ color: importMsg.startsWith('✓') ? 'var(--accent-cyan)' : 'var(--accent-pink)' }}>{importMsg}</span>}
          </div>
        </div>

        <div className={styles.divider} />

        {/* Save current */}
        <div className={styles.saveSection}>
          <p className={styles.sectionLabel}>Save current board</p>
          <div className={styles.saveRow}>
            <input
              className={styles.nameInput}
              placeholder="Template name…"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              maxLength={48}
            />
            <button className={`btn-primary ${styles.saveBtn}`} onClick={handleSave}>
              💾 Save
            </button>
          </div>
          <p className={styles.saveHint}>
            Saves prizes ({currentBoard.prizes.length}), players ({currentBoard.players.length}) and settings
          </p>
        </div>

        <div className={styles.divider} />

        {/* Starter templates */}
        <div className={styles.listSection}>
          <p className={styles.sectionLabel}>Starter templates</p>
          <div className={styles.list}>
            {PREBUILT_TEMPLATES.map(tpl => (
              <div key={tpl.id} className={`${styles.item} ${styles.prebuiltItem}`}>
                <div className={styles.itemLeft}>
                  <span className={styles.itemName}>{tpl.name}</span>
                  <span className={styles.itemMeta}>{tpl.prizes.length} prizes · {tpl.players.length} players</span>
                </div>
                <div className={styles.itemActions}>
                  <button className={styles.actionBtn} onClick={() => { onLoad(tpl); onClose() }} title="Load">
                    ▶ Load
                  </button>
                  <button className={styles.actionBtn} onClick={() => downloadTemplate(tpl)} title="Download as file">
                    ⬇ Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.divider} />

        {/* Saved template list */}
        <div className={styles.listSection}>
          <p className={styles.sectionLabel}>Saved templates</p>

          {templates.length === 0 && (
            <div className={styles.empty}>No templates saved yet</div>
          )}

          <div className={styles.list}>
            {templates.map(tpl => (
              <div key={tpl.id} className={styles.item}>
                <div className={styles.itemLeft}>
                  {renamingId === tpl.id
                    ? (
                      <input
                        className={styles.renameInput}
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(tpl.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitRename(tpl.id)
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                        autoFocus
                        maxLength={48}
                      />
                    )
                    : (
                      <span className={styles.itemName} onDoubleClick={() => startRename(tpl)}>
                        {tpl.name}
                      </span>
                    )
                  }
                  <span className={styles.itemMeta}>
                    {tpl.prizes.length} prizes · {tpl.players.length} players · {formatDate(tpl.createdAt)}
                  </span>
                </div>
                <div className={styles.itemActions}>
                  <button className={styles.actionBtn} onClick={() => { onLoad(tpl); onClose() }} title="Load">
                    ▶ Load
                  </button>
                  <button
                    className={`${styles.actionBtn} ${copiedId === tpl.id ? styles.copied : ''}`}
                    onClick={() => handleShare(tpl)}
                    title="Copy share link"
                  >
                    {copiedId === tpl.id ? '✓ Copied!' : '🔗 Share'}
                  </button>
                  <button className={styles.actionBtn} onClick={() => downloadTemplate(tpl)} title="Download as file">
                    ⬇ Save
                  </button>
                  <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => onRemove(tpl.id)} title="Delete">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        </div>{/* end modalBody */}
      </div>
    </div>
  )
}
