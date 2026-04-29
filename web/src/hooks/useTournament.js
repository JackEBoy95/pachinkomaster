import { useState, useCallback, useEffect } from 'react'

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}
function saveLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function useTournament() {
  const [tournament, setTournament] = useState(() => {
    const saved = loadLS('pm_tournament', null)
    if (!saved) return null
    // Clear any pending round result — balls can't be replayed after a reload,
    // so drop the user back to the "ready to drop" state for the current round.
    return saved.roundResult ? { ...saved, roundResult: null } : saved
  })

  // Keep localStorage in sync on every tournament state change
  useEffect(() => {
    if (tournament) saveLS('pm_tournament', tournament)
    else localStorage.removeItem('pm_tournament')
  }, [tournament])

  const startTournament = useCallback((players, config = {}) => {
    setTournament({
      round: 1,
      survivors: players.map(p => ({ ...p })),
      eliminated: [],        // [{player, roundEliminated, roundScore, totalPoints}]
      cumulativeScores: {},  // {playerId: totalPoints} — accumulated across all rounds
      roundResult: null,
      config: {
        eliminationPerRound: config.eliminationPerRound ?? 0, // 0 = auto (25%)
        maxRounds:           config.maxRounds           ?? 0, // 0 = unlimited
      },
    })
  }, [])

  const processRound = useCallback((roundScores, landOrder = {}) => {
    setTournament(prev => {
      if (!prev) return null
      const { survivors, eliminated, round, config = {}, cumulativeScores = {} } = prev

      // Sort ascending by score (lowest eliminated first).
      // Tiebreaker: among equal scores, later lander (higher sequence) is eliminated first.
      const sorted = survivors
        .map(p => ({ player: p, score: roundScores[p.id] ?? 0, landSeq: landOrder[p.id] ?? 0 }))
        .sort((a, b) => a.score !== b.score ? a.score - b.score : b.landSeq - a.landSeq)

      // Update cumulative scores for every player who played this round
      const newCumulativeScores = { ...cumulativeScores }
      sorted.forEach(s => {
        newCumulativeScores[s.player.id] = (newCumulativeScores[s.player.id] ?? 0) + s.score
      })

      // Eliminate configured count, or fall back to bottom 25% (min 1, max survivors-1)
      const eliminateCount = Math.min(
        config.eliminationPerRound > 0
          ? config.eliminationPerRound
          : Math.max(1, Math.floor(survivors.length / 4)),
        survivors.length - 1,
      )

      const toEliminate = sorted.slice(0, eliminateCount)
      const newSurvivors = sorted.slice(eliminateCount).map(s => s.player)
      const newEliminated = [
        ...eliminated,
        ...toEliminate.map(s => ({
          player:         s.player,
          roundEliminated: round,
          roundScore:     s.score,
          totalPoints:    newCumulativeScores[s.player.id],
        })),
      ]

      const hitMaxRounds = config.maxRounds > 0 && round >= config.maxRounds
      const isComplete   = newSurvivors.length <= 1 || hitMaxRounds

      // Legacy champion field kept for backward compat
      const champion = isComplete
        ? newSurvivors.length > 0
          ? sorted[sorted.length - 1].player
          : toEliminate[0]?.player
        : null

      // ── Dual winner system ────────────────────────────────────────────────
      let survivorEntry    = null
      let pointsEntry      = null
      let cleanSweep       = false
      let finalLeaderboard = null

      if (isComplete) {
        // Build final leaderboard sorted by total points descending
        finalLeaderboard = [
          // Players who survived all rounds — elimination round is null (they never got cut)
          ...newSurvivors.map(p => ({
            player:          p,
            totalPoints:     newCumulativeScores[p.id] ?? 0,
            eliminationRound: null,
          })),
          // Eliminated players — already have totalPoints stored
          ...newEliminated.map(e => ({
            player:          e.player,
            totalPoints:     e.totalPoints,
            eliminationRound: e.roundEliminated,
          })),
        ].sort((a, b) => b.totalPoints - a.totalPoints)

        // 🛡️ Survivor: last player not eliminated.
        // If multiple survivors (max-rounds hit), pick the one with most total points.
        if (newSurvivors.length > 0) {
          const best = [...newSurvivors].sort(
            (a, b) => (newCumulativeScores[b.id] ?? 0) - (newCumulativeScores[a.id] ?? 0)
          )[0]
          survivorEntry = {
            player:      best,
            totalPoints: newCumulativeScores[best.id] ?? 0,
          }
        }

        // 🎯 Points champion: highest cumulative score overall
        pointsEntry = finalLeaderboard[0] ?? null

        // ⚡ Clean sweep: same player holds both titles
        cleanSweep = !!(survivorEntry && pointsEntry &&
          survivorEntry.player.id === pointsEntry.player.id)
      }

      return {
        round: round + 1,
        survivors:        newSurvivors,
        eliminated:       newEliminated,
        cumulativeScores: newCumulativeScores,
        config,
        roundResult: {
          roundNumber:     round,
          eliminated:      toEliminate,               // [{player, score}] this round only
          surviving:       sorted.slice(eliminateCount), // [{player, score}] this round only
          isComplete,
          hitMaxRounds,
          champion,        // legacy
          survivorEntry,   // 🛡️  {player, totalPoints} | null
          pointsEntry,     // 🎯  {player, totalPoints, eliminationRound} | null
          cleanSweep,      // ⚡  boolean
          finalLeaderboard, // full sorted standings | null
        },
      }
    })
  }, [])

  const dismissRound = useCallback(() => {
    setTournament(prev => {
      if (!prev) return null
      if (prev.roundResult?.isComplete) return null // ends tournament
      return { ...prev, roundResult: null }
    })
  }, [])

  const cancelTournament = useCallback(() => setTournament(null), [])

  return {
    tournament,
    isTournamentActive: tournament !== null,
    startTournament,
    processTournamentRound: processRound,
    dismissTournamentRound: dismissRound,
    cancelTournament,
  }
}
