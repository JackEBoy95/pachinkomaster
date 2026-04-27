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
      eliminated: [], // [{player, roundEliminated, roundScore}]
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
      const { survivors, eliminated, round, config = {} } = prev

      // Sort ascending by score (lowest eliminated first).
      // Tiebreaker: among equal scores, later lander (higher sequence) is eliminated first.
      const sorted = survivors
        .map(p => ({ player: p, score: roundScores[p.id] ?? 0, landSeq: landOrder[p.id] ?? 0 }))
        .sort((a, b) => a.score !== b.score ? a.score - b.score : b.landSeq - a.landSeq)

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
          player: s.player,
          roundEliminated: round,
          roundScore: s.score,
        })),
      ]

      const hitMaxRounds = config.maxRounds > 0 && round >= config.maxRounds
      const isComplete   = newSurvivors.length <= 1 || hitMaxRounds

      // Champion = sole survivor, or highest scorer when round limit hit, or last eliminated
      const champion = isComplete
        ? newSurvivors.length > 0
          ? sorted[sorted.length - 1].player
          : toEliminate[0]?.player
        : null

      return {
        round: round + 1,
        survivors: newSurvivors,
        eliminated: newEliminated,
        config,
        roundResult: {
          roundNumber: round,
          eliminated: toEliminate,              // [{player, score}]
          surviving: sorted.slice(eliminateCount), // [{player, score}]
          isComplete,
          hitMaxRounds,
          champion,
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
