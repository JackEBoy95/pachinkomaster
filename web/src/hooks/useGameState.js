import { useState, useCallback, useRef, useEffect } from 'react'

const DEFAULT_PRIZES = [
  { id: 1, label: 'Movie Night',  points: 10, color: '#FF4FA3' },
  { id: 2, label: 'Pizza',        points: 20, color: '#F5C842' },
  { id: 3, label: 'Board Game',   points: 15, color: '#00E5FF' },
  { id: 4, label: 'Go Outside',   points: 5,  color: '#39FF14' },
  { id: 5, label: 'Takeaway',     points: 25, color: '#BF5FFF' },
  { id: 6, label: 'Wild Card',    points: 50, color: '#FF6B00' },
]

const DEFAULT_PLAYERS = [
  { id: 1, name: 'Player 1', color: '#FF4FA3', score: 0, ballSkin: '' },
  { id: 2, name: 'Player 2', color: '#00E5FF', score: 0, ballSkin: '' },
]

let nextId = 100

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}
function saveLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

const PRIZE_COLOR_PALETTE = [
  '#FF4FA3','#F5C842','#00E5FF','#39FF14','#BF5FFF','#FF6B00',
  '#FF3860','#23D160','#3273DC','#FF7043','#AB47BC','#26C6DA',
  '#EC407A','#66BB6A','#42A5F5','#FFA726','#7E57C2','#26A69A',
]

function pickDistinctColor(existingColors) {
  const used = new Set(existingColors.map(c => c.toLowerCase()))
  const available = PRIZE_COLOR_PALETTE.filter(c => !used.has(c.toLowerCase()))
  const pool = available.length > 0 ? available : PRIZE_COLOR_PALETTE
  return pool[Math.floor(Math.random() * pool.length)]
}

export function useGameState() {
  const [prizes, setPrizes] = useState(() => {
    const saved = loadLS('pm_prizes', null)
    if (saved?.length) {
      // Keep nextId above any restored IDs so new additions never clash
      nextId = Math.max(nextId, ...saved.map(p => p.id))
      return saved
    }
    return DEFAULT_PRIZES
  })
  const [players, setPlayers] = useState(() => {
    const saved = loadLS('pm_players', null)
    if (saved?.length) {
      nextId = Math.max(nextId, ...saved.map(p => p.id))
      return saved
    }
    return DEFAULT_PLAYERS
  })
  const [activePlayerId, setActivePlayerId] = useState(1)
  const [history, setHistory] = useState([])
  const [result, setResult]   = useState(null)

  // Mirrors of state kept in refs so callbacks can read current values
  // without nesting setState calls (which React Strict Mode double-invokes)
  const prizesRef          = useRef(prizes)
  const playersRef         = useRef(players)
  const activePlayerIdRef  = useRef(activePlayerId)

  useEffect(() => { prizesRef.current         = prizes;  saveLS('pm_prizes',  prizes)  }, [prizes])
  useEffect(() => { playersRef.current        = players; saveLS('pm_players', players) }, [players])
  useEffect(() => { activePlayerIdRef.current = activePlayerId }, [activePlayerId])

  const roundResultsRef = useRef([])
  const roundIdRef      = useRef(0)

  // ── Prizes ──────────────────────────────────
  const addPrize = useCallback(() => {
    const id = ++nextId
    setPrizes(p => {
      const color = pickDistinctColor(p.map(pr => pr.color))
      return [...p, { id, label: 'New Prize', points: 10, color, image: null }]
    })
  }, [])
  const updatePrize = useCallback((id, field, value) => {
    setPrizes(p => p.map(prize => prize.id === id ? { ...prize, [field]: value } : prize))
  }, [])
  const removePrize = useCallback((id) => {
    setPrizes(p => p.filter(prize => prize.id !== id))
  }, [])

  // ── Players ─────────────────────────────────
  const addPlayer = useCallback(() => {
    const id = ++nextId
    const colors = ['#FF4FA3', '#00E5FF', '#39FF14', '#F5C842', '#BF5FFF', '#FF6B00']
    setPlayers(p => [
      ...p,
      { id, name: `Player ${p.length + 1}`, color: colors[p.length % colors.length], score: 0, ballSkin: '' }
    ])
  }, [])
  const updatePlayer = useCallback((id, field, value) => {
    setPlayers(p => p.map(player => player.id === id ? { ...player, [field]: value } : player))
  }, [])
  const removePlayer = useCallback((id) => {
    setPlayers(p => p.filter(player => player.id !== id))
    setActivePlayerId(prev => prev === id ? (playersRef.current.find(p => p.id !== id)?.id ?? null) : prev)
  }, [])

  // ── Ball landed ──────────────────────────────────────────────────────────
  // Reads current prizes/players from refs so we never nest setState calls.
  // Nested setState updaters are called twice by React Strict Mode, causing
  // score/history/ref mutations to fire double. Flat top-level calls are safe.
  const onBallLanded = useCallback((prizeIndex, playerId, isLast) => {
    const prize = prizesRef.current[prizeIndex]
    if (!prize) return

    const resolvedId = playerId ?? activePlayerIdRef.current
    const player     = playersRef.current.find(p => p.id === resolvedId)
    if (!player) return

    // ── Score update (flat — not nested) ────────────────────────────────
    setPlayers(current =>
      current.map(p => p.id === resolvedId ? { ...p, score: p.score + prize.points } : p)
    )

    // ── History entry ────────────────────────────────────────────────────
    if (roundResultsRef.current.length === 0) roundIdRef.current += 1
    const currentRoundId = roundIdRef.current

    const entry = {
      id:          ++nextId,
      roundId:     currentRoundId,
      playerName:  player.name,
      playerColor: player.color,
      prizeName:   prize.label,
      points:      prize.points,
      ts:          Date.now(),
    }
    setHistory(h => [entry, ...h].slice(0, 200))

    // ── Round result accumulation ─────────────────────────────────────────
    roundResultsRef.current = [
      ...roundResultsRef.current,
      { player: { ...player, score: player.score + prize.points }, prize },
    ]

    if (isLast) {
      const roundResults = roundResultsRef.current
      roundResultsRef.current = []

      if (roundResults.length === 1) {
        setResult({ player: roundResults[0].player, prize: roundResults[0].prize, isMultiDrop: false })
      } else {
        const scoredThisRound = {}
        roundResults.forEach(({ player: p, prize: pr }) => {
          scoredThisRound[p.id] = (scoredThisRound[p.id] || 0) + pr.points
        })
        const winnerId = Object.entries(scoredThisRound).sort((a, b) => b[1] - a[1])[0]?.[0]
        const winner   = playersRef.current.find(p => String(p.id) === String(winnerId))
        setResult({
          isMultiDrop:  true,
          roundResults,
          roundWinner:  winner,
          roundScores:  scoredThisRound,
        })
      }
    }
  }, []) // no deps needed — everything read from refs

  // ── Load template ────────────────────────────────────────────────────────
  const loadBoard = useCallback(({ prizes, players }) => {
    setPrizes(prizes.map(p => ({ ...p })))
    setPlayers(players.map(p => ({ ...p, score: 0 })))
    setHistory([])
    setResult(null)
    roundResultsRef.current = []
    roundIdRef.current = 0
  }, [])

  const dismissResult = useCallback(() => setResult(null), [])
  const clearScores   = useCallback(() => {
    setPlayers(p => p.map(player => ({ ...player, score: 0 })))
    setHistory([])
    roundResultsRef.current = []
  }, [])

  return {
    prizes, addPrize, updatePrize, removePrize,
    players, addPlayer, updatePlayer, removePlayer,
    activePlayerId, setActivePlayerId,
    history,
    result, onBallLanded, dismissResult,
    clearScores, loadBoard,
  }
}
