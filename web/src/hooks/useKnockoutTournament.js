import { useState, useCallback } from 'react'

// ── Helpers ────────────────────────────────────────────────────────────────────

function getRoundName(playersInRound) {
  if (playersInRound === 2) return 'Final'
  if (playersInRound === 4) return 'Semi-finals'
  if (playersInRound === 8) return 'Quarter-finals'
  return `Round of ${playersInRound}`
}

/**
 * Build a full bracket from an ordered seed list.
 * Standard "top-seed avoids top-seed until late" pairing:
 *   seed 1 vs N, seed 2 vs N-1, ... seed N/2 vs N/2+1
 * Subsequent rounds are empty placeholders filled as winners advance.
 */
function buildBracketFromSeeds(seeds) {
  const n = seeds.length  // must be a power of 2
  const rounds = []

  // Round 1
  const r1 = []
  for (let i = 0; i < n / 2; i++) {
    r1.push({
      id: `r0m${i}`,
      p1: seeds[i],
      p2: seeds[n - 1 - i],
      score1: null,
      score2: null,
      winner: null,
      loser: null,
    })
  }
  rounds.push({ name: getRoundName(n), matches: r1 })

  // Placeholder rounds
  let size = n / 2
  let ri = 1
  while (size >= 2) {
    const matches = []
    for (let i = 0; i < size / 2; i++) {
      matches.push({
        id: `r${ri}m${i}`,
        p1: null,
        p2: null,
        score1: null,
        score2: null,
        winner: null,
        loser: null,
      })
    }
    rounds.push({ name: getRoundName(size), matches })
    size /= 2
    ri++
  }

  return {
    size: n,
    seeds,
    rounds,
    currentRound: 0,
    currentMatch: 0,
    matchResult: null,
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useKnockoutTournament() {
  const [knockout, setKnockout] = useState(null)

  /** Initialise — sets up the qualifying phase. */
  const startKnockout = useCallback((players, config = {}) => {
    const knockoutRounds = config.knockoutRounds ?? 7
    const rawSize  = Math.pow(2, knockoutRounds) // 2, 4, 8, …, 128
    // Snap to the largest power-of-2 that fits the actual player count so the
    // UI shows the real bracket size from the start, not an unachievable target.
    const maxFit      = Math.min(rawSize, players.length)
    const bracketSize = Math.pow(2, Math.floor(Math.log2(Math.max(2, maxFit))))
    setKnockout({
      phase: 'qualifying',
      config: {
        qualifyingBalls: config.qualifyingBalls ?? 1,
        matchBalls:      config.matchBalls      ?? 50,
        knockoutRounds,
        bracketSize,
      },
      allPlayers:       players.map(p => ({ ...p })),
      qualifyingResult: null,
      bracket:          null,
      winner:           null,
    })
  }, [])

  /** Record qualifying scores, decide who advances. */
  const processQualifying = useCallback((scores) => {
    setKnockout(prev => {
      if (!prev || prev.phase !== 'qualifying') return prev
      const { config, allPlayers } = prev
      const { bracketSize } = config

      const sorted = allPlayers
        .map(p => ({ player: p, score: scores[p.id] ?? 0 }))
        .sort((a, b) => b.score - a.score)

      // Bracket must be a power of 2 and can't exceed the number of players.
      // Snap down to the largest valid power of 2 that fits — e.g. if bracketSize
      // is 128 but only 50 players entered, use 32 (not 50) so every player in
      // the bracket always has an opponent.
      const maxFit = Math.min(bracketSize, allPlayers.length)
      const actualSize = Math.pow(2, Math.floor(Math.log2(Math.max(2, maxFit))))

      return {
        ...prev,
        qualifyingResult: {
          scores,
          advancers:   sorted.slice(0, actualSize),
          eliminated:  sorted.slice(actualSize),
          bracketSize: actualSize,
        },
      }
    })
  }, [])

  /** Dismiss the qualifying result card and build the bracket. */
  const dismissQualifying = useCallback(() => {
    setKnockout(prev => {
      if (!prev?.qualifyingResult) return prev
      const seeds   = prev.qualifyingResult.advancers.map(a => a.player)
      const bracket = buildBracketFromSeeds(seeds)
      return { ...prev, phase: 'bracket', qualifyingResult: null, bracket }
    })
  }, [])

  /** Record match scores, advance winner, queue next match. */
  const processMatch = useCallback((scores) => {
    setKnockout(prev => {
      if (!prev || prev.phase !== 'bracket' || !prev.bracket) return prev
      const { bracket } = prev
      const { currentRound, currentMatch, rounds } = bracket
      const match  = rounds[currentRound].matches[currentMatch]

      const score1 = scores[match.p1?.id] ?? 0
      const score2 = scores[match.p2?.id] ?? 0
      // Tie → p1 (first seed) wins
      const winner = score1 >= score2 ? match.p1 : match.p2
      const loser  = score1 >= score2 ? match.p2 : match.p1

      const updatedMatch = { ...match, score1, score2, winner, loser }

      // Slot the winner into the next round
      const nextRoundIdx  = currentRound + 1
      const nextMatchIdx  = Math.floor(currentMatch / 2)
      const isP1          = currentMatch % 2 === 0

      const newRounds = rounds.map((r, ri) => {
        if (ri === currentRound) {
          return { ...r, matches: r.matches.map((m, mi) => mi === currentMatch ? updatedMatch : m) }
        }
        if (ri === nextRoundIdx && nextRoundIdx < rounds.length) {
          return {
            ...r,
            matches: r.matches.map((m, mi) => {
              if (mi !== nextMatchIdx) return m
              return isP1 ? { ...m, p1: winner } : { ...m, p2: winner }
            }),
          }
        }
        return r
      })

      const isComplete = currentRound === rounds.length - 1

      // Advance cursor
      const totalMatchesInRound = rounds[currentRound].matches.length
      let nextRound = currentRound
      let nextMatch = currentMatch + 1
      if (nextMatch >= totalMatchesInRound) { nextRound = currentRound + 1; nextMatch = 0 }

      return {
        ...prev,
        winner: isComplete ? winner : prev.winner,
        bracket: {
          ...bracket,
          rounds:       newRounds,
          currentRound: isComplete ? currentRound : nextRound,
          currentMatch: isComplete ? currentMatch : nextMatch,
          matchResult:  { match: updatedMatch, winner, loser, score1, score2, isComplete },
        },
      }
    })
  }, [])

  /** Dismiss the current match result card (ends tournament if final). */
  const dismissMatchResult = useCallback(() => {
    setKnockout(prev => {
      if (!prev?.bracket?.matchResult) return prev
      if (prev.bracket.matchResult.isComplete) return null // ends tournament
      return { ...prev, bracket: { ...prev.bracket, matchResult: null } }
    })
  }, [])

  const cancelKnockout = useCallback(() => setKnockout(null), [])

  return {
    knockout,
    isKnockoutActive: knockout !== null,
    startKnockout,
    processQualifying,
    dismissQualifying,
    processMatch,
    dismissMatchResult,
    cancelKnockout,
  }
}
