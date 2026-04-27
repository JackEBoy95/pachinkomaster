import { useRef } from 'react'
import styles from './PrizePanel.module.css'

export default function PrizePanel({ prizes, onAdd, onUpdate, onRemove }) {
  const isMobileCapped = prizes.length >= 6 && window.innerWidth <= 640

  return (
    <div className={`panel ${styles.panel}`}>
      <div className="panel-header">
        <h3>Prizes</h3>
        <button className="btn-icon" onClick={onAdd} title="Add prize" disabled={isMobileCapped}>+</button>
      </div>
      {isMobileCapped && (
        <p className={styles.mobileCapHint}>6 prize max on mobile</p>
      )}
      <div className={`panel-body ${styles.list}`}>
        {prizes.map((prize) => (
          <PrizeRow
            key={prize.id}
            prize={prize}
            onUpdate={onUpdate}
            onRemove={onRemove}
            canRemove={prizes.length > 2}
          />
        ))}
      </div>
    </div>
  )
}

function PrizeRow({ prize, onUpdate, onRemove, canRemove }) {
  const fileInputRef = useRef(null)

  function handleImageClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onUpdate(prize.id, 'image', ev.target.result)
    reader.readAsDataURL(file)
    // Reset so the same file can be re-selected after removal
    e.target.value = ''
  }

  function handleRemoveImage(e) {
    e.stopPropagation()
    onUpdate(prize.id, 'image', null)
  }

  return (
    <div className={styles.row}>
      {/* Image upload slot */}
      <div className={styles.imgSlot} onClick={handleImageClick} title="Click to add an image">
        {prize.image
          ? <img src={prize.image} alt="" className={styles.imgThumb} />
          : <span className={styles.imgPlus}>＋</span>
        }
        {prize.image && (
          <button className={styles.imgRemove} onClick={handleRemoveImage} title="Remove image">×</button>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Colour swatch */}
      <input
        type="color"
        className={styles.colorInput}
        value={prize.color}
        onChange={e => onUpdate(prize.id, 'color', e.target.value)}
        title="Prize colour"
      />

      {/* Label */}
      <input
        type="text"
        value={prize.label}
        onChange={e => onUpdate(prize.id, 'label', e.target.value)}
        placeholder="Prize name"
        className={styles.labelInput}
      />

      {/* Points */}
      <input
        type="number"
        value={prize.points}
        onChange={e => onUpdate(prize.id, 'points', Number(e.target.value))}
        min={0}
        max={9999}
        className={styles.pointsInput}
        title="Points"
      />
      <span className={styles.ptLabel}>pts</span>

      {canRemove && (
        <button className="btn-icon" onClick={() => onRemove(prize.id)} title="Remove">×</button>
      )}
    </div>
  )
}
