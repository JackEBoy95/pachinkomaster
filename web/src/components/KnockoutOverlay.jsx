import { memo } from 'react'
import styles from './KnockoutOverlay.module.css'

const TWEMOJI_CDN = 'https://twemoji.maxcdn.com/v/latest/svg'
const twemojiUrl  = cp => `${TWEMOJI_CDN}/${cp.toLowerCase()}.svg`

// ── Ball with skin ────────────────────────────────────────────────────────────

function BallWithSkin({ player, size = 48 }) {
  const skin = player?.ballSkin ?? ''
  return (
    <div
      className={styles.ball}
      style={{
        width: size, height: size,
        background: `radial-gradient(circle at 35% 35%, ${lighten(player?.color ?? '#888')}, ${player?.color ?? '#888'})`,
        boxShadow: `0 0 12px ${player?.color ?? '#888'}55`,
      }}
    >
      {skin.startsWith('cflag:') ? (
        <img
          src={`https://hatscripts.github.io/circle-flags/flags/${skin.replace('cflag:', '')}.svg`}
          className={styles.ballSkinImg}
          alt=""
        />
      ) : skin.startsWith('emoji:') ? (
        <img
          src={twemojiUrl(skin.replace('emoji:', ''))}
          className={styles.ballSkinEmoji}
          alt=""
        />
      ) : skin && skin !== 'classic' ? (
        <span className={styles.ballSkinChar} style={{ fontSize: size * 0.5 }}>{skin}</span>
      ) : null}
    </div>
  )
}

function lighten(hex) {
  try {
    const n = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, ((n >> 16) & 0xff) + 60)
    const g = Math.min(255, ((n >> 8)  & 0xff) + 60)
    const b = Math.min(255, ( n        & 0xff) + 60)
    return `rgb(${r},${g},${b})`
  } catch { return hex }
}

// ── Qualifying result card ────────────────────────────────────────────────────

export function QualifyingResultCard({ result, onNext }) {
  if (!result) return null
  const { advancers, eliminated, bracketSize } = result

  return (
    <div className={styles.backdrop}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.badge}>⚡ KNOCKOUT</span>
          <span className={styles.title}>Qualifying Complete</span>
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryNum} style={{ color: 'var(--accent-cyan)' }}>{bracketSize}</span>
            <span className={styles.summaryLabel}>Advance to bracket</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryNum} style={{ color: 'var(--accent-pink)' }}>{eliminated.length}</span>
            <span className={styles.summaryLabel}>Eliminated</span>
          </div>
        </div>

        <div className={styles.seedList}>
          <div className={styles.seedListHeader}>Top seeds</div>
          <div className={styles.seedRows}>
            {advancers.slice(0, 8).map(({ player, score }, i) => (
              <div key={player.id} className={styles.seedRow}>
                <span className={styles.seedNum} style={{ color: player.color }}>#{i + 1}</span>
                <BallWithSkin player={player} size={22} />
                <span className={styles.seedName}>{player.name}</span>
                <span className={styles.seedScore}>{score}pts</span>
              </div>
            ))}
            {advancers.length > 8 && (
              <div className={styles.seedMore}>+{advancers.length - 8} more advancing…</div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button className={`btn-primary ${styles.nextBtn}`} onClick={onNext}>
            BUILD BRACKET →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Match result card ─────────────────────────────────────────────────────────

export const MatchResultCard = memo(function MatchResultCard({ matchResult, roundName, matchNumber, totalMatches, onNext }) {
  if (!matchResult) return null
  const { match, winner, loser, score1, score2, isComplete } = matchResult

  return (
    <div className={styles.backdrop}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.badge}>⚡ KNOCKOUT</span>
          <span className={styles.title}>
            {isComplete ? 'Tournament Complete!' : `${roundName} — Match ${matchNumber} of ${totalMatches}`}
          </span>
        </div>

        <div className={styles.matchup}>
          <PlayerResult
            player={match.p1}
            score={score1}
            isWinner={match.p1?.id === winner?.id}
            label="P1"
          />
          <div className={styles.vsLabel}>VS</div>
          <PlayerResult
            player={match.p2}
            score={score2}
            isWinner={match.p2?.id === winner?.id}
            label="P2"
          />
        </div>

        {isComplete && (
          <div className={styles.champion}>
            <div className={styles.championLabel}>🏆 CHAMPION</div>
            <BallWithSkin player={winner} size={64} />
            <div className={styles.championName} style={{ color: winner?.color }}>{winner?.name}</div>
          </div>
        )}

        <div className={styles.actions}>
          <button className={`btn-primary ${styles.nextBtn}`} onClick={onNext}>
            {isComplete ? '🎉 Finish' : matchNumber < totalMatches ? 'NEXT MATCH →' : 'NEXT ROUND →'}
          </button>
        </div>
      </div>
    </div>
  )
})

function PlayerResult({ player, score, isWinner }) {
  return (
    <div className={`${styles.playerResult} ${isWinner ? styles.playerResultWinner : styles.playerResultLoser}`}>
      <BallWithSkin player={player} size={isWinner ? 52 : 40} />
      <div className={styles.playerResultName} style={{ color: player?.color }}>{player?.name}</div>
      <div className={styles.playerResultScore}>{score ?? 0}<span className={styles.pts}>pts</span></div>
      {isWinner && <div className={styles.winnerTag}>✓ ADVANCES</div>}
      {!isWinner && <div className={styles.loserTag}>✕ ELIMINATED</div>}
    </div>
  )
}
