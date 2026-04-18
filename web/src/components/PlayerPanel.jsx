import { useState } from 'react'
import styles from './PlayerPanel.module.css'

// ── Emoji flag skins ─────────────────────────────────────────────────────────
export const FLAG_SKINS = [
  { id: '',          label: 'Solid colour', preview: null },
  { id: 'flag:🇺🇸',  label: 'USA',           preview: '🇺🇸' },
  { id: 'flag:🇬🇧',  label: 'UK',            preview: '🇬🇧' },
  { id: 'flag:🇯🇵',  label: 'Japan',         preview: '🇯🇵' },
  { id: 'flag:🇫🇷',  label: 'France',        preview: '🇫🇷' },
  { id: 'flag:🇩🇪',  label: 'Germany',       preview: '🇩🇪' },
  { id: 'flag:🇧🇷',  label: 'Brazil',        preview: '🇧🇷' },
  { id: 'flag:🇦🇺',  label: 'Australia',     preview: '🇦🇺' },
  { id: 'flag:🇨🇦',  label: 'Canada',        preview: '🇨🇦' },
  { id: 'flag:🇮🇹',  label: 'Italy',         preview: '🇮🇹' },
  { id: 'flag:🇪🇸',  label: 'Spain',         preview: '🇪🇸' },
  { id: 'flag:🇲🇽',  label: 'Mexico',        preview: '🇲🇽' },
  { id: 'flag:🇰🇷',  label: 'S. Korea',      preview: '🇰🇷' },
  { id: 'flag:🇨🇳',  label: 'China',         preview: '🇨🇳' },
  { id: 'flag:🇮🇳',  label: 'India',         preview: '🇮🇳' },
  { id: 'flag:🇵🇹',  label: 'Portugal',      preview: '🇵🇹' },
  { id: 'flag:🇳🇱',  label: 'Netherlands',   preview: '🇳🇱' },
  { id: 'flag:🇦🇷',  label: 'Argentina',     preview: '🇦🇷' },
  { id: 'flag:🇿🇦',  label: 'S. Africa',     preview: '🇿🇦' },
  { id: 'flag:🇳🇬',  label: 'Nigeria',       preview: '🇳🇬' },
  { id: 'flag:🇸🇦',  label: 'Saudi Arabia',  preview: '🇸🇦' },
  { id: 'flag:🇷🇺',  label: 'Russia',        preview: '🇷🇺' },
  { id: 'flag:🏳️‍🌈', label: 'Pride',         preview: '🏳️‍🌈' },
  { id: 'flag:🏴‍☠️', label: 'Pirate',        preview: '🏴‍☠️' },
]

// ── Image skins — drop matching .png files into public/skins/ ────────────────
// Organised by category. Files must be named exactly as `file` below.
export const IMAGE_SKIN_CATEGORIES = [
  {
    label: 'Faces',
    skins: [
      { id: 'img:happy',    label: 'Happy',    file: 'happy.png' },
      { id: 'img:cool',     label: 'Cool',     file: 'cool.png' },
      { id: 'img:angry',    label: 'Angry',    file: 'angry.png' },
      { id: 'img:silly',    label: 'Silly',    file: 'silly.png' },
      { id: 'img:wink',     label: 'Wink',     file: 'wink.png' },
      { id: 'img:love',     label: 'Love',     file: 'love.png' },
    ],
  },
  {
    label: 'Animals',
    skins: [
      { id: 'img:cat',      label: 'Cat',      file: 'cat.png' },
      { id: 'img:dog',      label: 'Dog',      file: 'dog.png' },
      { id: 'img:fox',      label: 'Fox',      file: 'fox.png' },
      { id: 'img:bear',     label: 'Bear',     file: 'bear.png' },
      { id: 'img:panda',    label: 'Panda',    file: 'panda.png' },
      { id: 'img:lion',     label: 'Lion',     file: 'lion.png' },
      { id: 'img:frog',     label: 'Frog',     file: 'frog.png' },
      { id: 'img:penguin',  label: 'Penguin',  file: 'penguin.png' },
      { id: 'img:unicorn',  label: 'Unicorn',  file: 'unicorn.png' },
      { id: 'img:shark',    label: 'Shark',    file: 'shark.png' },
    ],
  },
  {
    label: 'Icons',
    skins: [
      { id: 'img:star',     label: 'Star',     file: 'star.png' },
      { id: 'img:heart',    label: 'Heart',    file: 'heart.png' },
      { id: 'img:fire',     label: 'Fire',     file: 'fire.png' },
      { id: 'img:lightning',label: 'Lightning',file: 'lightning.png' },
      { id: 'img:skull',    label: 'Skull',    file: 'skull.png' },
      { id: 'img:crown',    label: 'Crown',    file: 'crown.png' },
      { id: 'img:diamond',  label: 'Diamond',  file: 'diamond.png' },
      { id: 'img:rocket',   label: 'Rocket',   file: 'rocket.png' },
    ],
  },
]

// Flat list of all image skins for easy lookup
export const ALL_IMAGE_SKINS = IMAGE_SKIN_CATEGORIES.flatMap(c => c.skins)

// ── Component ─────────────────────────────────────────────────────────────────
export default function PlayerPanel({ players, activePlayerId, onSelect, onAdd, onUpdate, onRemove }) {
  return (
    <div className={`panel ${styles.panel}`}>
      <div className="panel-header">
        <h3>Players <span className={styles.playerCount}>({players.length})</span></h3>
        <button className="btn-icon" onClick={onAdd} title="Add player">+</button>
      </div>
      <div className={`panel-body ${styles.list}`}>
        {players.map((player) => (
          <PlayerRow
            key={player.id}
            player={player}
            isActive={player.id === activePlayerId}
            onSelect={() => onSelect(player.id)}
            onUpdate={onUpdate}
            onRemove={onRemove}
            canRemove={players.length > 1}
          />
        ))}
      </div>
      <div className={styles.footer}>
        <span className={styles.hint}>Tap a player to set them active</span>
      </div>
    </div>
  )
}

function PlayerRow({ player, isActive, onSelect, onUpdate, onRemove, canRemove }) {
  const [showSkins, setShowSkins] = useState(false)
  const [skinTab, setSkinTab]     = useState('flags') // 'flags' | 'images'

  const currentFlag = FLAG_SKINS.find(s => s.id === (player.ballSkin || '')) || null
  const currentImg  = ALL_IMAGE_SKINS.find(s => s.id === player.ballSkin) || null

  const skinPreviewEmoji = currentFlag?.preview || null
  const skinPreviewImg   = currentImg ? `/skins/${currentImg.file}` : null

  return (
    <div
      className={`${styles.row} ${isActive ? styles.active : ''}`}
      onClick={onSelect}
    >
      {/* Ball preview */}
      <div
        className={styles.ballPreview}
        style={{
          background: `radial-gradient(circle at 35% 35%, ${lighten(player.color)}, ${player.color} 60%, ${darken(player.color)})`,
          boxShadow: isActive ? `0 0 10px ${player.color}` : undefined,
        }}
      >
        {skinPreviewEmoji && <span className={styles.skinOnBall}>{skinPreviewEmoji}</span>}
        {skinPreviewImg   && (
          <img
            src={skinPreviewImg}
            className={styles.imgOnBall}
            alt=""
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        )}
      </div>

      {/* Name + score stacked */}
      <div className={styles.details}>
        <input
          type="text"
          value={player.name}
          onChange={e => { e.stopPropagation(); onUpdate(player.id, 'name', e.target.value) }}
          onClick={e => e.stopPropagation()}
          className={styles.nameInput}
          placeholder="Player name"
        />
        <div className={styles.score}>
          <span className={styles.scoreValue} style={{ color: player.color }}>{player.score}</span>
          <span className={styles.scorePts}>pts</span>
        </div>
      </div>

      {/* Colour picker */}
      <input
        type="color"
        value={player.color}
        onChange={e => { e.stopPropagation(); onUpdate(player.id, 'color', e.target.value) }}
        onClick={e => e.stopPropagation()}
        title="Ball colour"
      />

      {/* Skin picker */}
      <div className={styles.skinWrap} onClick={e => e.stopPropagation()}>
        <button
          className={styles.skinBtn}
          onClick={e => { e.stopPropagation(); setShowSkins(v => !v) }}
          title="Ball skin"
        >
          {skinPreviewEmoji || (skinPreviewImg
            ? <img src={skinPreviewImg} style={{ width: 14, height: 14, objectFit: 'contain' }} alt="" onError={e => { e.currentTarget.style.display='none' }} />
            : '🎱'
          )}
        </button>

        {showSkins && (
          <div className={styles.skinDropdown}>
            {/* Tabs */}
            <div className={styles.skinTabs}>
              <button
                className={`${styles.skinTabBtn} ${skinTab === 'flags' ? styles.skinTabActive : ''}`}
                onClick={() => setSkinTab('flags')}
              >🏁 Flags</button>
              <button
                className={`${styles.skinTabBtn} ${skinTab === 'images' ? styles.skinTabActive : ''}`}
                onClick={() => setSkinTab('images')}
              >🖼️ Images</button>
            </div>

            {skinTab === 'flags' && (
              <div className={styles.skinGrid}>
                {FLAG_SKINS.map(skin => (
                  <button
                    key={skin.id}
                    className={`${styles.skinOption} ${player.ballSkin === skin.id ? styles.skinSelected : ''}`}
                    onClick={() => { onUpdate(player.id, 'ballSkin', skin.id); setShowSkins(false) }}
                    title={skin.label}
                  >
                    {skin.preview || <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>●</span>}
                  </button>
                ))}
              </div>
            )}

            {skinTab === 'images' && (
              <div className={styles.imageSkinPanel}>
                {IMAGE_SKIN_CATEGORIES.map(cat => (
                  <div key={cat.label} className={styles.imgCatSection}>
                    <div className={styles.imgCatLabel}>{cat.label}</div>
                    <div className={styles.skinGrid}>
                      {cat.skins.map(skin => (
                        <button
                          key={skin.id}
                          className={`${styles.skinOption} ${styles.imgSkinOption} ${player.ballSkin === skin.id ? styles.skinSelected : ''}`}
                          onClick={() => { onUpdate(player.id, 'ballSkin', skin.id); setShowSkins(false) }}
                          title={skin.label}
                        >
                          <img
                            src={`/skins/${skin.file}`}
                            alt={skin.label}
                            className={styles.imgSkinPreview}
                            onError={e => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextSibling.style.display = 'flex'
                            }}
                          />
                          <span className={styles.imgSkinMissing} style={{ display: 'none' }}>
                            {skin.label.slice(0, 3)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <p className={styles.imgHint}>
                  Drop <code>.png</code> files into <code>public/skins/</code> to enable these slots.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {canRemove && (
        <button
          className="btn-icon"
          onClick={e => { e.stopPropagation(); onRemove(player.id) }}
          title="Remove"
        >×</button>
      )}
      {isActive && <div className={styles.activeDot} />}
    </div>
  )
}

function lighten(hex) {
  const num = parseInt(hex.replace('#',''), 16)
  return `rgb(${Math.min(255,(num>>16)+60)},${Math.min(255,((num>>8)&0xff)+60)},${Math.min(255,(num&0xff)+60)})`
}
function darken(hex) {
  const num = parseInt(hex.replace('#',''), 16)
  return `rgb(${Math.max(0,(num>>16)-40)},${Math.max(0,((num>>8)&0xff)-40)},${Math.max(0,(num&0xff)-40)})`
}
