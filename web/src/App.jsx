import { useState, useEffect, useCallback, useRef } from 'react'
import PhysicsBoard from './components/PhysicsBoard'
import PrizePanel from './components/PrizePanel'
import PlayerPanel from './components/PlayerPanel'
import Leaderboard from './components/Leaderboard'
import ResultOverlay from './components/ResultOverlay'
import SkinSelector from './components/SkinSelector'
import SettingsPanel from './components/SettingsPanel'
import TemplateModal from './components/TemplateModal'
import AdBanner from './components/AdBanner'
import { useGameState } from './hooks/useGameState'
import { useSound } from './hooks/useSound'
import { useTemplates } from './hooks/useTemplates'
import { parseSharedTemplate } from './hooks/useTemplates'
import styles from './App.module.css'

export default function App() {
  const [skin, setSkin]             = useState('classic')
  const [speed, setSpeed]           = useState('normal')
  const [leftTab, setLeftTab]       = useState('prizes')    // 'prizes' | 'players' | 'settings'
  const [ballSize, setBallSize]     = useState(12)    // ball radius px
  const [pegDensity, setPegDensity] = useState(8)     // columns of pegs
  const [bounciness, setBounciness] = useState(0.5)   // restitution 0.1–0.9
  const [ballCount, setBallCount]   = useState(1)     // balls per drop
  const [showTemplates, setShowTemplates] = useState(false)
  const [sharedTpl, setSharedTpl]         = useState(null) // pending shared import
  const boardRef = useRef(null)

  const {
    prizes, addPrize, updatePrize, removePrize,
    players, addPlayer, updatePlayer, removePlayer,
    activePlayerId, setActivePlayerId,
    history, result, onBallLanded, dismissResult, clearScores, loadBoard,
  } = useGameState()

  const { templates, save: saveTemplate, remove: removeTemplate, rename: renameTemplate } = useTemplates()

  const {
    sfxEnabled, musicEnabled,
    filesReady, anyFilesReady,
    toggleSfx, toggleMusic,
    playPegHit, playBallLand, playFanfare,
  } = useSound()

  // Total balls per drop capped at 200 total — derived after players is available
  const maxBallCount = Math.max(1, Math.floor(200 / Math.max(1, players.length)))
  const activePlayer = players.find(p => p.id === activePlayerId) || players[0]

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', skin)
  }, [skin])

  // Play sounds on result
  useEffect(() => {
    if (result) playFanfare()
  }, [result, playFanfare])

  // Re-clamp ball count if player count changes and lowers the max
  useEffect(() => {
    setBallCount(c => Math.min(c, maxBallCount))
  }, [maxBallCount])

  // Detect shared template in URL hash on first load
  useEffect(() => {
    const tpl = parseSharedTemplate()
    if (tpl) setSharedTpl(tpl)
  }, [])

  // Template actions
  const handleSaveTemplate = useCallback((name) => {
    saveTemplate(name, {
      prizes, players,
      settings: { ballSize, pegDensity, bounciness, ballCount },
    })
  }, [saveTemplate, prizes, players, ballSize, pegDensity, bounciness, ballCount])

  const handleLoadTemplate = useCallback((tpl) => {
    loadBoard({ prizes: tpl.prizes, players: tpl.players })
    if (tpl.settings) {
      setBallSize(tpl.settings.ballSize ?? 12)
      setPegDensity(tpl.settings.pegDensity ?? 8)
      setBounciness(tpl.settings.bounciness ?? 0.5)
      setBallCount(tpl.settings.ballCount ?? 1)
    }
  }, [loadBoard])

  // Wrap onBallLanded to play land sound
  const handleBallLanded = useCallback((idx, playerId, isLast) => {
    playBallLand()
    onBallLanded(idx, playerId, isLast)
  }, [onBallLanded, playBallLand])

  const handleDrop = useCallback(() => {
    boardRef.current?.dropBalls(ballCount)
  }, [ballCount])

  const handleDropAll = useCallback(() => {
    boardRef.current?.dropAllPlayers(players, ballCount)
  }, [players, ballCount])

  const clampBallCount = (v) => Math.max(1, Math.min(maxBallCount, Number(v) || 1))

  return (
    <div className={styles.app}>
      {/* ── Shared template import banner ───────── */}
      {sharedTpl && (
        <div className={styles.importBanner}>
          <span>🔗 Shared board: <strong>{sharedTpl.name || 'Untitled'}</strong></span>
          <button
            className={styles.importAccept}
            onClick={() => { handleLoadTemplate(sharedTpl); setSharedTpl(null); window.location.hash = '' }}
          >Load it</button>
          <button className={styles.importDismiss} onClick={() => { setSharedTpl(null); window.location.hash = '' }}>✕</button>
        </div>
      )}
      {/* ── Header ──────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎰</span>
          <h1 className={styles.logoText}>
            <span className={styles.logoMain}>PACHINKO</span>
            <span className={styles.logoSub}> CHOICE MACHINE</span>
          </h1>
        </div>

        <div className={styles.controls}>
          {/* Speed */}
          <div className={styles.speedGroup}>
            {['slow', 'normal', 'fast'].map(s => (
              <button
                key={s}
                className={`${styles.speedBtn} ${speed === s ? styles.speedActive : ''}`}
                onClick={() => setSpeed(s)}
              >
                {s === 'slow' ? '🐢' : s === 'normal' ? '⚡' : '🔥'}
                <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
              </button>
            ))}
          </div>

          {/* Sound toggles — only show when files are present */}
          {anyFilesReady && (
            <div className={styles.soundGroup}>
              {filesReady.pegHit || filesReady.ballLand || filesReady.fanfare ? (
                <button
                  className={`${styles.soundBtn} ${sfxEnabled ? styles.soundOn : ''}`}
                  onClick={toggleSfx}
                  title="Toggle sound effects"
                >
                  {sfxEnabled ? '🔊' : '🔇'} SFX
                </button>
              ) : null}
              {filesReady.bgMusic && (
                <button
                  className={`${styles.soundBtn} ${musicEnabled ? styles.soundOn : ''}`}
                  onClick={toggleMusic}
                  title="Toggle background music"
                >
                  {musicEnabled ? '🎵' : '🎵'} Music
                </button>
              )}
            </div>
          )}

          <button
            className={styles.templateBtn}
            onClick={() => setShowTemplates(true)}
            title="Save / load templates"
          >
            📁 Templates
          </button>

          <SkinSelector currentSkin={skin} onChange={setSkin} />
        </div>
      </header>

      {/* ── Main ────────────────────────────────── */}
      <main className={styles.main}>
        {/* Left sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.tabBar}>
            <button
              className={`${styles.tab} ${leftTab === 'prizes' ? styles.tabActive : ''}`}
              onClick={() => setLeftTab('prizes')}
            >🏆 Prizes</button>
            <button
              className={`${styles.tab} ${leftTab === 'players' ? styles.tabActive : ''}`}
              onClick={() => setLeftTab('players')}
            >🎮 Players</button>
            <button
              className={`${styles.tab} ${leftTab === 'settings' ? styles.tabActive : ''}`}
              onClick={() => setLeftTab('settings')}
            >⚙️</button>
          </div>
          <div className={styles.tabContent}>
            {leftTab === 'prizes' && (
              <PrizePanel
                prizes={prizes}
                onAdd={addPrize}
                onUpdate={updatePrize}
                onRemove={removePrize}
              />
            )}
            {leftTab === 'players' && (
              <PlayerPanel
                players={players}
                activePlayerId={activePlayerId}
                onSelect={setActivePlayerId}
                onAdd={addPlayer}
                onUpdate={updatePlayer}
                onRemove={removePlayer}
              />
            )}
            {leftTab === 'settings' && (
              <SettingsPanel
                ballSize={ballSize}       setBallSize={setBallSize}
                pegDensity={pegDensity}   setPegDensity={setPegDensity}
                bounciness={bounciness}   setBounciness={setBounciness}
              />
            )}
          </div>
        </aside>

        {/* Board */}
        <section className={styles.boardSection}>
          <div className={styles.boardWrapper}>
            <PhysicsBoard
              ref={boardRef}
              prizes={prizes}
              activePlayer={activePlayer}
              onBallLanded={handleBallLanded}
              speed={speed}
              ballSize={ballSize}
              pegDensity={pegDensity}
              bounciness={bounciness}
              onPegHit={playPegHit}
            />
          </div>

          {/* Drop controls */}
          <div className={styles.dropArea}>
            {activePlayer && (
              <div className={styles.activePill} style={{ borderColor: activePlayer.color }}>
                <div
                  className={styles.activeBall}
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${lighten(activePlayer.color)}, ${activePlayer.color})`,
                    boxShadow: `0 0 10px ${activePlayer.color}`,
                  }}
                />
                <span style={{ color: activePlayer.color }}>{activePlayer.name}</span>
              </div>
            )}

            {/* Ball count selector */}
            <div className={styles.countSelector}>
              <button
                className={styles.countBtn}
                onClick={() => setBallCount(c => Math.max(1, c - 1))}
                disabled={ballCount <= 1}
              >−</button>
              <div className={styles.countDisplay}>
                <input
                  type="number"
                  min={1}
                  max={maxBallCount}
                  value={ballCount}
                  onChange={e => setBallCount(clampBallCount(e.target.value))}
                  className={styles.countInput}
                />
                <span className={styles.countLabel} title={`Max ${maxBallCount} per player (200 total cap)`}>
                  {ballCount === 1 ? 'ball' : 'balls'}
                </span>
              </div>
              <button
                className={styles.countBtn}
                onClick={() => setBallCount(c => Math.min(maxBallCount, c + 1))}
                disabled={ballCount >= maxBallCount}
              >+</button>
            </div>

            <button
              className={`btn-primary ${styles.dropBtn}`}
              onClick={handleDrop}
            >
              DROP {ballCount > 1 ? `×${ballCount}` : ''}
            </button>

            <button
              className={`btn-secondary ${styles.dropAllBtn}`}
              onClick={handleDropAll}
              title={`Drop ${ballCount} ball${ballCount > 1 ? 's' : ''} for every player simultaneously`}
            >
              ALL PLAYERS
            </button>
          </div>
        </section>

        {/* Right sidebar */}
        <aside className={styles.sidebar}>
          <Leaderboard
            players={players}
            history={history}
            onClear={clearScores}
          />
        </aside>
      </main>

      <AdBanner />

      <ResultOverlay result={result} onDismiss={dismissResult} />

      {showTemplates && (
        <TemplateModal
          templates={templates}
          currentBoard={{ prizes, players }}
          onSave={handleSaveTemplate}
          onLoad={handleLoadTemplate}
          onRename={renameTemplate}
          onRemove={removeTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  )
}

function lighten(hex) {
  const num = parseInt(hex.replace('#',''), 16)
  return `rgb(${Math.min(255,(num>>16)+60)},${Math.min(255,((num>>8)&0xff)+60)},${Math.min(255,(num&0xff)+60)})`
}
