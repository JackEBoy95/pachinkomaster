import { memo } from 'react'
import styles from './KnockoutBracket.module.css'

const TWEMOJI_CDN = 'https://twemoji.maxcdn.com/v/latest/svg'
const twemojiUrl  = cp => `${TWEMOJI_CDN}/${cp.toLowerCase()}.svg`

// ── Tiny ball dot ──────────────────────────────────────────────────────────────

function BallDot({ player, size = 18 }) {
  const skin = player?.ballSkin ?? ''
  return (
    <div
      className={styles.ballDot}
      style={{
        width: size, height: size,
        background: player?.color ?? '#888',
      }}
    >
      {skin.startsWith('cflag:') && (
        <img
          src={`https://hatscripts.github.io/circle-flags/flags/${skin.replace('cflag:', '')}.svg`}
          className={styles.ballDotImg}
          alt=""
        />
      )}
      {skin.startsWith('emoji:') && (
        <img
          src={twemojiUrl(skin.replace('emoji:', ''))}
          className={styles.ballDotEmoji}
          alt=""
        />
      )}
      {skin && !skin.startsWith('cflag:') && !skin.startsWith('emoji:') && skin !== 'classic' && (
        <span className={styles.ballDotChar} style={{ fontSize: size * 0.55 }}>{skin}</span>
      )}
    </div>
  )
}

// ── Main bracket panel ────────────────────────────────────────────────────────

const KnockoutBracket = memo(function KnockoutBracket({ knockout }) {
  if (!knockout) return (
    <div className={styles.empty}>No knockout tournament active.</div>
  )

  const { phase, allPlayers, qualifyingResult, bracket, winner, config } = knockout

  // ── Qualifying in progress ──
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

  // ── Bracket ──
  if (bracket) {
    const { rounds, currentRound, currentMatch } = bracket

    return (
      <div className={styles.panel}>
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
        </div>

        <div className={styles.rounds}>
          {rounds.map((round, ri) => {
            const isCurrentRound = ri === currentRound && !winner
            return (
              <div key={ri} className={`${styles.roundSection} ${isCurrentRound ? styles.roundSectionActive : ''}`}>
                <div className={styles.roundLabel}>
                  {round.name}
                  {isCurrentRound && <span className={styles.liveDot} />}
                </div>
                <div className={styles.matches}>
                  {round.matches.map((match, mi) => {
                    const isCurrent = ri === currentRound && mi === currentMatch && !winner
                    const isDone    = match.winner !== null
                    return (
                      <MatchRow
                        key={match.id}
                        match={match}
                        isCurrent={isCurrent}
                        isDone={isDone}
                        matchNumber={mi + 1}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return null
})

export default KnockoutBracket

// ── Individual match row ──────────────────────────────────────────────────────

const MatchRow = memo(function MatchRow({ match, isCurrent, isDone, matchNumber }) {
  const { p1, p2, score1, score2, winner } = match
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
  if (!player) {
    return <span className={styles.tbd}>TBD</span>
  }
  return (
    <div className={`${styles.slot} ${isDone && !isWinner ? styles.slotElim : ''} ${isWinner ? styles.slotWinner : ''}`}>
      <BallDot player={player} size={14} />
      <span className={styles.slotName}>{player.name}</span>
      {isDone && <span className={styles.slotScore}>{score ?? 0}</span>}
    </div>
  )
}
