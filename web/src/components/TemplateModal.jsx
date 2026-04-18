import { useState } from 'react'
import { templateShareUrl } from '../hooks/useTemplates'
import styles from './TemplateModal.module.css'

export default function TemplateModal({ templates, currentBoard, onSave, onLoad, onRename, onRemove, onClose }) {
  const [saveName, setSaveName]       = useState('')
  const [copiedId, setCopiedId]       = useState(null)
  const [renamingId, setRenamingId]   = useState(null)
  const [renameValue, setRenameValue] = useState('')

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

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>📁 Templates</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

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

        {/* Template list */}
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
                  <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => onRemove(tpl.id)} title="Delete">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
