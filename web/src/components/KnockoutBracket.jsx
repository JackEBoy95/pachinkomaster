import { memo, useState, useEffect, useCallback } from 'react'
import styles from './KnockoutBracket.module.css'

const TWEMOJI_CDN = 'https://twemoji.maxcdn.com/v/latest/svg'
const twemojiUrl  = cp => `${TWEMOJI_CDN}/${cp.toLowerCase()}.svg`

// ── SVG bracket constants ──────────────────────────────────────────────────────
const MATCH_W   = 190
const MATCH_H   = 58   // total; 29px per player slot
const MATCH_GAP = 8
const COL_GAP   = 52   // space between columns where connector lines live
const HEADER_H  = 28
const CHAMPION_W = 160

function truncate(str, max) {
  if (!str) return 'TBD'
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

// y-center of match mi in round ri
function matchCenterY(ri, mi) {
  const slotH = (MATCH_H + MATCH_GAP) * Math.pow(2, ri)
  return HEADER_H + mi * slotH + slotH / 2
}

// y-top of match mi in round ri
function matchTopY(ri, mi) {
  return matchCenterY(ri, mi) - MATCH_H / 2
}

// x-left of matches in round ri
function matchLeftX(ri) {
  return ri * (MATCH_W + COL_GAP)
}

// ── SVG match box ─────────────────────────────────────────────────────────────

function MatchBox({ match, ri, mi, currentRound, currentMatch, total }) {
  const { p1, p2, score1, score2, winner } = match
  const x = matchLeftX(ri)
  const y = matchTopY(ri, mi)
  const isCurrent = ri === currentRound && mi === currentMatch && !winner
  const isDone    = winner !== null

  const borderColor = isCurrent ? '#F5C842' : isDone ? '#444' : '#333'
  const borderWidth = isCurrent ? 2 : 1

  const p1Won = isDone && winner?.id === p1?.id
  const p2Won = isDone && winner?.id === p2?.id

  const p1Fill = p1Won ? 'rgba(0,229,255,0.12)' : 'transparent'
  const p2Fill = p2Won ? 'rgba(0,229,255,0.12)' : 'transparent'
  const p1Opacity = isDone && !p1Won ? 0.35 : 1
  const p2Opacity = isDone && !p2Won ? 0.35 : 1

  const half = MATCH_H / 2

  return (
    <g>
      {/* Outer border */}
      <rect x={x} y={y} width={MATCH_W} height={MATCH_H}
        fill="#1a1a2e" stroke={borderColor} strokeWidth={borderWidth} rx={5} />

      {/* P1 background */}
      <rect x={x + borderWidth} y={y + borderWidth}
        width={MATCH_W - borderWidth * 2} height={half - borderWidth}
        fill={p1Fill} rx={4} />

      {/* Divider */}
      <line x1={x + 6} y1={y + half} x2={x + MATCH_W - 6} y2={y + half}
        stroke="#333" strokeWidth={1} />

      {/* P2 background */}
      <rect x={x + borderWidth} y={y + half}
        width={MATCH_W - borderWidth * 2} height={half - borderWidth}
        fill={p2Fill} rx={4} />

      {/* P1 dot */}
      {p1 && <circle cx={x + 14} cy={y + half / 2} r={5} fill={p1?.color ?? '#888'} opacity={p1Opacity} />}

      {/* P1 name */}
      <text x={x + 24} y={y + half / 2 + 4}
        fill={p1?.color ?? '#888'} fillOpacity={p1Opacity}
        fontSize={11} fontWeight={600}>
        {truncate(p1?.name, 16)}
      </text>

      {/* P1 score */}
      {score1 != null && (
        <text x={x + MATCH_W - 8} y={y + half / 2 + 4}
          fill={p1Won ? '#00E5FF' : '#888'} fillOpacity={p1Opacity}
          fontSize={11} fontWeight={700} textAnchor="end">
          {score1}
        </text>
      )}
      {p1Won && (
        <text x={x + MATCH_W - 24} y={y + half / 2 + 4}
          fill="#00E5FF" fontSize={9} fontWeight={700} textAnchor="end">✓</text>
      )}

      {/* P2 dot */}
      {p2 && <circle cx={x + 14} cy={y + half + half / 2} r={5} fill={p2?.color ?? '#888'} opacity={p2Opacity} />}

      {/* P2 name */}
      <text x={x + 24} y={y + half + half / 2 + 4}
        fill={p2?.color ?? '#888'} fillOpacity={p2Opacity}
        fontSize={11} fontWeight={600}>
        {truncate(p2?.name, 16)}
      </text>

      {/* P2 score */}
      {score2 != null && (
        <text x={x + MATCH_W - 8} y={y + half + half / 2 + 4}
          fill={p2Won ? '#00E5FF' : '#888'} fillOpacity={p2Opacity}
          fontSize={11} fontWeight={700} textAnchor="end">
          {score2}
        </text>
      )}
      {p2Won && (
        <text x={x + MATCH_W - 24} y={y + half + half / 2 + 4}
          fill="#00E5FF" fontSize={9} fontWeight={700} textAnchor="end">✓</text>
      )}

      {/* Current match pulse ring */}
      {isCurrent && (
        <rect x={x - 2} y={y - 2} width={MATCH_W + 4} height={MATCH_H + 4}
          fill="none" stroke="#F5C842" strokeWidth={1} rx={6} opacity={0.4} />
      )}
    </g>
  )
}

// ── Full SVG bracket ──────────────────────────────────────────────────────────

function BracketSVG({ bracket, winner }) {
  const { rounds, size } = bracket
  const numRounds = rounds.length

  const firstRoundMatches = size / 2
  const totalH = HEADER_H + firstRoundMatches * (MATCH_H + MATCH_GAP)
  const champX = matchLeftX(numRounds) + 16
  const totalW = champX + CHAMPION_W + 20

  // Build connector paths
  const connectors = []
  for (let ri = 0; ri < numRounds - 1; ri++) {
    const numMatches = rounds[ri].matches.length
    for (let pair = 0; pair < numMatches / 2; pair++) {
      const mi1 = pair * 2
      const mi2 = pair * 2 + 1
      const y1  = matchCenterY(ri, mi1)
      const y2  = matchCenterY(ri, mi2)
      const yMid = (y1 + y2) / 2
      const xRight = matchLeftX(ri) + MATCH_W
      const xMid   = xRight + COL_GAP / 2
      const xNext  = matchLeftX(ri + 1)

      connectors.push(
        <path key={`a${ri}-${pair}`}
          d={`M${xRight},${y1} H${xMid} V${yMid} H${xNext}`}
          fill="none" stroke="#2a2a4a" strokeWidth={1.5} />,
        <path key={`b${ri}-${pair}`}
          d={`M${xRight},${y2} H${xMid} V${yMid}`}
          fill="none" stroke="#2a2a4a" strokeWidth={1.5} />
      )
    }
  }

  // Connector from final to champion box
  if (winner) {
    const finalY = matchCenterY(numRounds - 1, 0)
    const xRight = matchLeftX(numRounds - 1) + MATCH_W
    connectors.push(
      <path key="champ-line"
        d={`M${xRight},${finalY} H${champX}`}
        fill="none" stroke="#F5C842" strokeWidth={1.5} />
    )
  }

  // Champion box
  const champY = matchCenterY(numRounds - 1, 0) - 40
  const champH = 80

  return (
    <svg width={totalW} height={Math.max(totalH + 10, 120)}
      style={{ display: 'block' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {connectors}

      {/* Round headers + matches */}
      {rounds.map((round, ri) => (
        <g key={ri}>
          <text
            x={matchLeftX(ri) + MATCH_W / 2}
            y={HEADER_H - 8}
            textAnchor="middle"
            fill="#F5C842"
            fontSize={10}
            fontWeight={700}
            letterSpacing={1}
          >
            {round.name.toUpperCase()}
          </text>
          {round.matches.map((match, mi) => (
            <MatchBox
              key={match.id}
              match={match}
              ri={ri} mi={mi}
              currentRound={bracket.currentRound}
              currentMatch={bracket.currentMatch}
              total={round.matches.length}
            />
          ))}
        </g>
      ))}

      {/* Champion box */}
      {winner && (
        <g filter="url(#glow)">
          <rect x={champX} y={champY} width={CHAMPION_W} height={champH}
            fill="#1a1a2e" stroke="#F5C842" strokeWidth={2} rx={8} />
          <text x={champX + CHAMPION_W / 2} y={champY + 18}
            textAnchor="middle" fill="#F5C842" fontSize={10} fontWeight={700} letterSpacing={1}>
            🏆 CHAMPION
          </text>
          <circle cx={champX + CHAMPION_W / 2} cy={champY + 40} r={10}
            fill={winner.color} />
          <text x={champX + CHAMPION_W / 2} y={champY + 62}
            textAnchor="middle" fill={winner.color} fontSize={13} fontWeight={700}>
            {truncate(winner.name, 14)}
          </text>
        </g>
      )}
    </svg>
  )
}

// ── Bracket modal ─────────────────────────────────────────────────────────────

function BracketModal({ bracket, winner, onClose }) {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>⚡ Knockout Bracket</span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <BracketSVG bracket={bracket} winner={winner} />
        </div>
      </div>
    </div>
  )
}

// ── Tiny ball dot ──────────────────────────────────────────────────────────────

function BallDot({ player, size = 18 }) {
  const skin = player?.ballSkin ?? ''
  return (
    <div className={styles.ballDot} style={{ width: size, height: size, background: player?.color ?? '#888' }}>
      {skin.startsWith('cflag:') && (
        <img src={`https://hatscripts.github.io/circle-flags/flags/${skin.replace('cflag:', '')}.svg`}
          className={styles.ballDotImg} alt="" />
      )}
      {skin.startsWith('emoji:') && (
        <img src={twemojiUrl(skin.replace('emoji:', ''))}
          className={styles.ballDotEmoji} alt="" />
      )}
      {skin && !skin.startsWith('cflag:') && !skin.startsWith('emoji:') && skin !== 'classic' && (
        <span className={styles.ballDotChar} style={{ fontSize: size * 0.55 }}>{skin}</span>
      )}
    </div>
  )
}

// ── Compact sidebar bracket panel ─────────────────────────────────────────────

const KnockoutBracket = memo(function KnockoutBracket({ knockout }) {
  const [showModal, setShowModal] = useState(false)
  // Only the current (active) round is expanded by default; completed rounds collapse
  const [expandedRounds, setExpandedRounds] = useState(() => new Set([0]))

  const toggleRound = useCallback((ri) => {
    setExpandedRounds(prev => {
      const next = new Set(prev)
      next.has(ri) ? next.delete(ri) : next.add(ri)
      return next
    })
  }, [])

  // Auto-expand the new active round and collapse the just-finished one
  const currentRound = knockout?.bracket?.currentRound ?? 0
  useEffect(() => {
    setExpandedRounds(prev => {
      const next = new Set(prev)
      next.add(currentRound)
      // Collapse all rounds before the current one
      for (let i = 0; i < currentRound; i++) next.delete(i)
      return next
    })
  }, [currentRound])

  if (!knockout) return (
    <div className={styles.empty}>No knockout tournament active.</div>
  )

  const { phase, allPlayers, qualifyingResult, bracket, winner, config } = knockout

  // Qualifying in progress
  if (phase === 'qualifying' && !qualifyingResult) {
    return (
      <div className={styles.panel}>
        <div className={styles.phaseHeader}>
          <span className={styles.phaseBadge}>⚡ KNOCKOUT</span>
          <span className={styles.phaseTitle}>Qualifying Round</span>
          <span className={styles.phaseSub}>
            {allPlayers.length} players · {config.qualifyingBalls} ball{config.qualifyingBalls !== 1 ? 's' : ''} each
            → top {config.bracketSize} advance
          </span>
        </div>
        <div className={styles.playerGrid}>
          {allPlayers.map(p => (
            <div key={p.id} className={styles.playerChip}>
              <BallDot player={p} size={16} />
              <span className={styles.chipName}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!bracket) return null

  const { rounds, currentMatch } = bracket

  return (
    <div className={styles.panel}>
      {showModal && (
        <BracketModal bracket={bracket} winner={winner} onClose={() => setShowModal(false)} />
      )}

      <div className={styles.phaseHeader}>
        <span className={styles.phaseBadge}>⚡ KNOCKOUT</span>
        <span className={styles.phaseTitle}>
          {winner ? '🏆 Complete' : rounds[currentRound]?.name ?? 'Bracket'}
        </span>
        {winner && (
          <span className={styles.phaseSub} style={{ color: winner.color }}>
            Champion: {winner.name}
          </span>
        )}
        <button className={styles.viewBracketBtn} onClick={() => setShowModal(true)}>
          📊 Full Bracket
        </button>
      </div>

      <div className={styles.rounds}>
        {rounds.map((round, ri) => {
          const isCurrentRound = ri === currentRound && !winner
          const isExpanded = expandedRounds.has(ri)
          const isDone = ri < currentRound || !!winner
          return (
            <div key={ri} className={`${styles.roundSection} ${isCurrentRound ? styles.roundSectionActive : ''}`}>
              <div className={styles.roundLabel} onClick={() => toggleRound(ri)}>
                {round.name}
                {isCurrentRound && <span className={styles.liveDot} />}
                {isDone && !isCurrentRound && (
                  <span className={styles.roundDoneTag}>✓</span>
                )}
                <span className={styles.roundChevron}>{isExpanded ? '▾' : '▸'}</span>
              </div>
              {isExpanded && (
                <div className={styles.matches}>
                  {round.matches.map((match, mi) => {
                    const isCurrent = ri === currentRound && mi === currentMatch && !winner
                    return (
                      <MatchRow
                        key={match.id}
                        match={match}
                        isCurrent={isCurrent}
                        matchNumber={mi + 1}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default KnockoutBracket

// ── Compact match row ─────────────────────────────────────────────────────────

const MatchRow = memo(function MatchRow({ match, isCurrent, matchNumber }) {
  const { p1, p2, score1, score2, winner } = match
  const isDone = winner !== null
  return (
    <div className={`${styles.matchRow} ${isCurrent ? styles.matchRowCurrent : ''}`}>
      <span className={styles.matchNum}>M{matchNumber}</span>
      <PlayerSlot player={p1} score={score1} isWinner={isDone && winner?.id === p1?.id} isDone={isDone} />
      <span className={styles.matchVs}>vs</span>
      <PlayerSlot player={p2} score={score2} isWinner={isDone && winner?.id === p2?.id} isDone={isDone} />
      {isCurrent && <span className={styles.currentTag}>▶</span>}
    </div>
  )
})

function PlayerSlot({ player, score, isWinner, isDone }) {
  if (!player) return <span className={styles.tbd}>TBD</span>
  return (
    <div className={`${styles.slot} ${isDone && !isWinner ? styles.slotElim : ''} ${isWinner ? styles.slotWinner : ''}`}>
      <BallDot player={player} size={14} />
      <span className={styles.slotName}>{player.name}</span>
      {isDone && <span className={styles.slotScore}>{score ?? 0}</span>}
    </div>
  )
}
