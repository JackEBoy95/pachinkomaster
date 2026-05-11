import { useState, useEffect, useCallback, useRef, useDeferredValue } from 'react'
import PhysicsBoard from './components/PhysicsBoard'
import PrizePanel from './components/PrizePanel'
import PlayerPanel from './components/PlayerPanel'
import Leaderboard from './components/Leaderboard'
import ResultOverlay from './components/ResultOverlay'
import SkinSelector from './components/SkinSelector'
import SettingsPanel from './components/SettingsPanel'
import TemplateModal from './components/TemplateModal'
import AdBanner from './components/AdBanner'
import AdInterstitial from './components/AdInterstitial'
import TournamentOverlay from './components/TournamentOverlay'
import KnockoutBracket from './components/KnockoutBracket'
import { QualifyingResultCard, MatchResultCard } from './components/KnockoutOverlay'
import { useGameState } from './hooks/useGameState'
import { useSound } from './hooks/useSound'
import { useTemplates } from './hooks/useTemplates'
import { parseSharedTemplate } from './hooks/useTemplates'
import { useTournament } from './hooks/useTournament'
import { useKnockoutTournament } from './hooks/useKnockoutTournament'
import styles from './App.module.css'

export default function App() {
  const [skin, setSkin]             = useState('classic')
  const [speed, setSpeed]           = useState('normal')
  const [leftTab, setLeftTab]       = useState('prizes')    // 'prizes' | 'players' | 'settings'
  const [mobileTab, setMobileTab]   = useState('board')     // 'board' | 'config' | 'scores'
  const [ballSize, setBallSize]     = useState(17)    // ball radius px
  const [pegDensity, setPegDensity] = useState(() => window.innerWidth <= 640 ? 12 : 12)
  const [bounciness, setBounciness] = useState(() => window.innerWidth <= 640 ? 0.6 : 0.5)
  const [ballCount, setBallCount]   = useState(1)     // balls per drop
  const [tournamentConfig, setTournamentConfig] = useState({ eliminationPerRound: 0, maxRounds: 0 })
  const [knockoutConfig, setKnockoutConfig]     = useState({ qualifyingBalls: 1, matchBalls: 50, knockoutRounds: 7 })
  const [rightTab, setRightTab]                 = useState('scores')  // 'scores' | 'bracket'
  const [showTemplates, setShowTemplates] = useState(false)
  const [sharedTpl, setSharedTpl]         = useState(null) // pending shared import
  const [showAd, setShowAd]               = useState(false)
  const dropCountRef      = useRef(0)
  // Randomise ad cadence: show after 3–7 drops (re-rolled each time ad fires)
  const nextAdThresholdRef = useRef(Math.floor(Math.random() * 5) + 3)
  const boardRef = useRef(null)

  const {
    prizes, addPrize, updatePrize, removePrize,
    players, addPlayer, updatePlayer, removePlayer,
    activePlayerId, setActivePlayerId,
    history, result, onBallLanded, dismissResult, clearScores, loadBoard,
  } = useGameState()

  const { templates, save: saveTemplate, remove: removeTemplate, rename: renameTemplate, importFromData: importTemplate } = useTemplates()

  const {
    tournament, isTournamentActive,
    startTournament, processTournamentRound,
    dismissTournamentRound, cancelTournament,
  } = useTournament()

  const {
    knockout, isKnockoutActive,
    startKnockout, processQualifying, dismissQualifying,
    processMatch, dismissMatchResult, cancelKnockout,
  } = useKnockoutTournament()

  const { playPegHit, playBallLand, playFanfare } = useSound()

  // Total balls per drop capped at 200 total — derived after players is available
  const maxBallCount = Math.max(1, Math.floor(200 / Math.max(1, players.length)))
  const activePlayer = players.find(p => p.id === activePlayerId) || players[0]

  // Defer leaderboard data so ball-landing re-renders don't block the overlay
  const deferredPlayers = useDeferredValue(players)
  const deferredHistory = useDeferredValue(history)

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', skin)
  }, [skin])

  // Play fanfare on result — skip during tournament (handled per-round instead)
  useEffect(() => {
    if (result && !tournamentRef.current) playFanfare()
  }, [result, playFanfare])

  // Re-clamp ball count if player count changes and lowers the max
  useEffect(() => {
    setBallCount(c => Math.min(c, maxBallCount))
  }, [maxBallCount])

  // Tournament round scores — tracked directly from ball-land events,
  // independent of useGameState's nested setState internals
  const tournamentScoresRef   = useRef({})
  // Landing sequence per player: lower = landed earlier, higher = landed later
  // Used as tiebreaker: among equal scores, latest lander is eliminated first
  const tournamentLandSeqRef  = useRef({}) // playerId -> sequence number
  const tournamentLandCtrRef  = useRef(0)  // incrementing counter
  const tournamentRef         = useRef(tournament)
  useEffect(() => { tournamentRef.current = tournament }, [tournament])

  // Knockout match scores — same pattern as tournament
  const knockoutScoresRef  = useRef({})
  const knockoutRef        = useRef(knockout)
  useEffect(() => { knockoutRef.current = knockout }, [knockout])

  // Switch to bracket tab automatically when knockout starts
  useEffect(() => {
    if (isKnockoutActive) setRightTab('bracket')
    else setRightTab('scores')
  }, [isKnockoutActive])

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

  // Wrap onBallLanded to play sound and track tournament scores
  const handleBallLanded = useCallback((idx, playerId, isLast) => {
    playBallLand()

    if (tournamentRef.current && playerId != null) {
      const pts = prizes[idx]?.points ?? 0
      const s   = tournamentScoresRef.current
      s[playerId] = (s[playerId] || 0) + pts
      // Record landing sequence — always overwrite so the LAST ball per player counts
      tournamentLandSeqRef.current[playerId] = tournamentLandCtrRef.current++
      if (isLast) {
        const snapshot  = { ...s }
        const landOrder = { ...tournamentLandSeqRef.current }
        tournamentScoresRef.current  = {}
        tournamentLandSeqRef.current = {}
        tournamentLandCtrRef.current = 0
        processTournamentRound(snapshot, landOrder)
      }
    }

    // Knockout mode — track per-player scores for qualifying and match drops
    if (knockoutRef.current && playerId != null) {
      const pts = prizes[idx]?.points ?? 0
      knockoutScoresRef.current[playerId] = (knockoutScoresRef.current[playerId] || 0) + pts
      if (isLast) {
        const snapshot = { ...knockoutScoresRef.current }
        knockoutScoresRef.current = {}
        if (knockoutRef.current.phase === 'qualifying') {
          processQualifying(snapshot)
        } else if (knockoutRef.current.phase === 'bracket') {
          processMatch(snapshot)
        }
      }
    }

    onBallLanded(idx, playerId, isLast)
  }, [onBallLanded, playBallLand, prizes, processTournamentRound, processQualifying, processMatch])

  const handleDrop = useCallback(() => {
    boardRef.current?.dropBalls(ballCount)
  }, [ballCount])

  const handleDropAll = useCallback(() => {
    boardRef.current?.dropAllPlayers(players, ballCount)
  }, [players, ballCount])

  const handleKnockoutDrop = useCallback(() => {
    if (!knockout) return
    if (knockout.phase === 'qualifying') {
      boardRef.current?.dropAllPlayers(knockout.allPlayers, knockout.config.qualifyingBalls, 'funnel')
    } else if (knockout.phase === 'bracket' && knockout.bracket) {
      const { bracket } = knockout
      const match = bracket.rounds[bracket.currentRound]?.matches[bracket.currentMatch]
      if (match?.p1 && match?.p2) {
        boardRef.current?.dropAllPlayers([match.p1, match.p2], knockout.config.matchBalls, 'funnel')
      }
    }
  }, [knockout])

  // Called by PhysicsBoard when a resize/orientation change destroys the engine
  // while balls are still in flight. Discard any partial scores for that drop
  // so the round can be cleanly re-played.
  const handleDropAborted = useCallback(() => {
    knockoutScoresRef.current      = {}
    tournamentScoresRef.current    = {}
    tournamentLandSeqRef.current   = {}
    tournamentLandCtrRef.current   = 0
    dismissResult()
  }, [dismissResult])

  const handleDismissKnockout = useCallback(() => {
    if (!knockout) return
    dismissResult() // always clear useGameState result so overlayShown resets
    if (knockout.qualifyingResult) {
      dismissQualifying()
    } else if (knockout.bracket?.matchResult) {
      dismissMatchResult()
    }
  }, [knockout, dismissResult, dismissQualifying, dismissMatchResult])

  const handleTournamentDrop = useCallback(() => {
    if (!tournament) return
    boardRef.current?.dropAllPlayers(tournament.survivors, 1, 'funnel')
  }, [tournament])

  const handleShower = useCallback(() => {
    boardRef.current?.dropAllPlayers(players, ballCount, 'shower')
  }, [players, ballCount])

  const handleDismissResult = useCallback(() => {
    dismissResult()
    // Show interstitial ad on mobile after a random 3–7 drops
    dropCountRef.current += 1
    if (dropCountRef.current >= nextAdThresholdRef.current) {
      dropCountRef.current = 0
      nextAdThresholdRef.current = Math.floor(Math.random() * 5) + 3
      setShowAd(true)
    }
  }, [dismissResult])

  // Tournament-specific ad: at the very end (all platforms) + after rounds 6/12 (mobile only)
  const handleDismissTournamentRound = useCallback(() => {
    const roundNum   = tournament?.roundResult?.roundNumber
    const isComplete = tournament?.roundResult?.isComplete
    dismissTournamentRound()
    // useGameState.onBallLanded sets `result` on every drop, including tournament
    // rounds. ResultOverlay is hidden during tournaments so `result` never gets
    // dismissed — which kept overlayShown=true and froze the physics loop for
    // the next round. Clear it here whenever a tournament round card is dismissed.
    dismissResult()
    const isMobile = window.innerWidth <= 640
    const midRoundAd = isMobile && (roundNum === 6 || roundNum === 12)
    if (isComplete || midRoundAd) {
      setShowAd(true)
    }
  }, [tournament, dismissTournamentRound, dismissResult])

  const clampBallCount = (v) => Math.max(1, Math.min(maxBallCount, Number(v) || 1))

  return (
    <div className={styles.app}>
      {/* ── Landscape rotation prompt ────────────── */}
      <div className="rotate-overlay">
        <div className="rotate-overlay__icon">📱</div>
        <div className="rotate-overlay__title">Rotate your phone</div>
        <div className="rotate-overlay__sub">PachinkoMaster works best in portrait mode</div>
      </div>

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
            <span className={styles.logoSub}>MASTER</span>
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

          <button
            className={styles.templateBtn}
            onClick={() => setShowTemplates(true)}
            title="Save / load games"
          >
            🎮 Games
          </button>

          <SkinSelector currentSkin={skin} onChange={setSkin} />
        </div>
      </header>

      {/* ── Main ────────────────────────────────── */}
      <main className={styles.main}>
        {/* Left sidebar */}
        <aside className={`${styles.sidebar} ${mobileTab === 'config' ? styles.mobilePanelVisible : ''}`}>
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
                ballSize={ballSize}             setBallSize={setBallSize}
                pegDensity={pegDensity}         setPegDensity={setPegDensity}
                bounciness={bounciness}         setBounciness={setBounciness}
                tournamentConfig={tournamentConfig} setTournamentConfig={setTournamentConfig}
                knockoutConfig={knockoutConfig}     setKnockoutConfig={setKnockoutConfig}
              />
            )}
          </div>
        </aside>

        {/* Board */}
        <section className={`${styles.boardSection} ${mobileTab === 'board' ? styles.mobilePanelVisible : ''}`}>
          <div className={styles.boardWrapper}>
            <PhysicsBoard
              ref={boardRef}
              prizes={prizes}
              activePlayer={activePlayer}
              onBallLanded={handleBallLanded}
              onDropAborted={handleDropAborted}
              speed={speed}
              ballSize={ballSize}
              pegDensity={pegDensity}
              bounciness={bounciness}
              onPegHit={playPegHit}
              skin={skin}
              locked={isTournamentActive || isKnockoutActive}
              overlayShown={
                !!tournament?.roundResult ||
                !!result ||
                !!knockout?.qualifyingResult ||
                !!knockout?.bracket?.matchResult
              }
            />
          </div>

          {/* Drop controls */}
          <div className={styles.dropArea}>
            {isKnockoutActive ? (
              // ── Knockout mode ──────────────────────────────
              <>
                <div className={styles.tournamentStatus}>
                  <span className={styles.tournamentBadge}>⚡ KNOCKOUT</span>
                  <span className={styles.tournamentInfo}>
                    {knockout.phase === 'qualifying'
                      ? `Qualifying · ${knockout.allPlayers.length} players`
                      : (() => {
                          const br = knockout.bracket
                          const roundName = br?.rounds[br.currentRound]?.name ?? ''
                          const matchNum  = (br?.currentMatch ?? 0) + 1
                          const total     = br?.rounds[br.currentRound]?.matches.length ?? 1
                          return `${roundName} · Match ${matchNum}/${total}`
                        })()
                    }
                  </span>
                </div>
                {knockout.phase === 'bracket' && knockout.bracket && (() => {
                  const br    = knockout.bracket
                  const match = br.rounds[br.currentRound]?.matches[br.currentMatch]
                  return match?.p1 && match?.p2 ? (
                    <div className={styles.matchupPill}>
                      <span style={{ color: match.p1.color }}>{match.p1.name}</span>
                      <span className={styles.matchupVs}>vs</span>
                      <span style={{ color: match.p2.color }}>{match.p2.name}</span>
                    </div>
                  ) : null
                })()}
                <button
                  className={`btn-primary ${styles.dropBtn}`}
                  onClick={handleKnockoutDrop}
                >
                  {knockout.phase === 'qualifying' ? 'DROP QUALIFYING' : 'DROP MATCH'}
                </button>
                <button
                  className={`btn-secondary ${styles.cancelTournamentBtn}`}
                  onClick={cancelKnockout}
                >✕ End</button>
              </>
            ) : isTournamentActive ? (
              // ── Elimination tournament mode ────────────────
              <>
                <div className={styles.tournamentStatus}>
                  <span className={styles.tournamentBadge}>🏆 TOURNAMENT</span>
                  <span className={styles.tournamentInfo}>
                    Round {tournament.round} · {tournament.survivors.length} remaining
                  </span>
                </div>
                <button
                  className={`btn-primary ${styles.dropBtn}`}
                  onClick={handleTournamentDrop}
                >
                  DROP ROUND {tournament.round}
                </button>
                <button
                  className={`btn-secondary ${styles.cancelTournamentBtn}`}
                  onClick={cancelTournament}
                >
                  ✕ End
                </button>
              </>
            ) : (
              <>
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

                <button
                  className={`btn-secondary ${styles.showerBtn}`}
                  onClick={handleShower}
                  title="Drop for every player from random positions across the board"
                >
                  🌧 SHOWER
                </button>

                {players.length >= 2 && (
                  <button
                    className={`btn-secondary ${styles.tournamentBtn}`}
                    onClick={() => startTournament(players, tournamentConfig)}
                    title="Start elimination tournament with all players"
                  >
                    🏆 TOURNAMENT
                  </button>
                )}
                {players.length >= 2 && (
                  <button
                    className={`btn-secondary ${styles.knockoutBtn}`}
                    onClick={() => startKnockout(players, knockoutConfig)}
                    title="Start knockout bracket tournament"
                  >
                    ⚡ KNOCKOUT
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        {/* Right sidebar */}
        <aside className={`${styles.sidebar} ${mobileTab === 'scores' ? styles.mobilePanelVisible : ''}`}>
          {isKnockoutActive && (
            <div className={styles.rightTabs}>
              <button
                className={`${styles.rightTab} ${rightTab === 'scores' ? styles.rightTabActive : ''}`}
                onClick={() => setRightTab('scores')}
              >📊 Scores</button>
              <button
                className={`${styles.rightTab} ${rightTab === 'bracket' ? styles.rightTabActive : ''}`}
                onClick={() => setRightTab('bracket')}
              >📋 Bracket</button>
            </div>
          )}
          <div className={styles.rightPanelWrap}>
            {rightTab === 'bracket' && isKnockoutActive
              ? <KnockoutBracket knockout={knockout} />
              : <Leaderboard
                  players={deferredPlayers}
                  history={deferredHistory}
                  onClear={clearScores}
                  tournament={isTournamentActive ? tournament : null}
                />
            }
          </div>
        </aside>
      </main>

      {/* ── Mobile bottom nav ───────────────────── */}
      <nav className={styles.mobileNav}>
        <button
          className={`${styles.mobileNavBtn} ${mobileTab === 'board' ? styles.mobileNavActive : ''}`}
          onClick={() => setMobileTab('board')}
        ><span>🎰</span>Board</button>
        <button
          className={`${styles.mobileNavBtn} ${mobileTab === 'config' ? styles.mobileNavActive : ''}`}
          onClick={() => setMobileTab('config')}
        ><span>⚙️</span>Config</button>
        <button
          className={`${styles.mobileNavBtn} ${mobileTab === 'scores' ? styles.mobileNavActive : ''}`}
          onClick={() => setMobileTab('scores')}
        ><span>📊</span>Scores</button>
      </nav>

      {/* AdBanner — re-enable once AdSense account is fully approved */}
      {/* <AdBanner /> */}

      {!isTournamentActive && !isKnockoutActive && <ResultOverlay result={result} onDismiss={handleDismissResult} />}

      {/* AdInterstitial — re-enable once AdSense account is fully approved */}
      {/* <AdInterstitial show={showAd} onClose={() => setShowAd(false)} /> */}

      <TournamentOverlay
        roundResult={tournament?.roundResult ?? null}
        onNext={handleDismissTournamentRound}
        onCancel={cancelTournament}
      />

      {/* Knockout overlays */}
      {isKnockoutActive && knockout?.qualifyingResult && (
        <QualifyingResultCard
          result={knockout.qualifyingResult}
          onNext={handleDismissKnockout}
        />
      )}
      {isKnockoutActive && knockout?.bracket?.matchResult && (() => {
        // The cursor may have advanced to next round after processMatch, so use
        // the completed match's own id to find which round it belongs to.
        const mr     = knockout.bracket.matchResult
        const matchId = mr.match.id   // e.g. "r2m3"
        const roundIdx = parseInt(matchId.replace(/^r/, ''), 10)
        const matchIdx = parseInt(matchId.replace(/^r\d+m/, ''), 10)
        const roundName   = knockout.bracket.rounds[roundIdx]?.name ?? ''
        const matchNumber = matchIdx + 1
        const totalMatches = knockout.bracket.rounds[roundIdx]?.matches.length ?? 1
        return (
          <MatchResultCard
            matchResult={mr}
            roundName={roundName}
            matchNumber={matchNumber}
            totalMatches={totalMatches}
            knockout={knockout}
            onNext={handleDismissKnockout}
          />
        )
      })()}

      {showTemplates && (
        <TemplateModal
          templates={templates}
          currentBoard={{ prizes, players }}
          onSave={handleSaveTemplate}
          onLoad={handleLoadTemplate}
          onRename={renameTemplate}
          onRemove={removeTemplate}
          onImport={importTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* ── Site footer (desktop only) ───────────── */}
      <footer className={styles.siteFooter}>
        <span>A free physics-based random decision maker — drop balls, settle debates, run tournaments.</span>
        <nav className={styles.footerLinks}>
          <a href="/about">About</a>
          <span>·</span>
          <a href="/privacy">Privacy Policy</a>
        </nav>
      </footer>
    </div>
  )
}

function lighten(hex) {
  const num = parseInt(hex.replace('#',''), 16)
  return `rgb(${Math.min(255,(num>>16)+60)},${Math.min(255,((num>>8)&0xff)+60)},${Math.min(255,(num&0xff)+60)})`
}
