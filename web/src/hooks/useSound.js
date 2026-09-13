import { useRef, useCallback, useState, useEffect } from 'react'

const SOUND_FILES = {
  pegHit:    '/sounds/mixkit-neutral-bot-pinbal-tone-3137.wav',
  ballLand:  '/sounds/ball-land.mp3',
  fanfare:   '/sounds/mixkit-happy-crowd-cheer-975.wav',
  bgMusic:   '/sounds/bg-music.mp3',
}

// Max concurrent peg-hit voices — prevents audio overload on big drops
const MAX_PEG_VOICES = 3
const PEG_THROTTLE_MS = 120

export function useSound() {
  const [sfxEnabled, setSfxEnabled]     = useState(true)
  const [musicEnabled, setMusicEnabled] = useState(false)
  const [filesReady, setFilesReady]     = useState({})

  const rawBuffers  = useRef({})   // ArrayBuffer — fetch only, no AudioContext needed
  const buffers     = useRef({})   // AudioBuffer — decoded, ready to play
  const ctxRef      = useRef(null)
  const bgRef       = useRef(null)
  const lastHit     = useRef(0)
  const pegVoices   = useRef(0)    // active peg-hit sources

  // Check which files exist and fetch raw bytes (no AudioContext needed yet)
  useEffect(() => {
    const checks = Object.entries(SOUND_FILES).map(async ([key, path]) => {
      try {
        const res = await fetch(path)
        if (!res.ok) return [key, false]
        rawBuffers.current[key] = await res.arrayBuffer()
        return [key, true]
      } catch {
        return [key, false]
      }
    })
    Promise.all(checks).then(results => setFilesReady(Object.fromEntries(results)))
  }, [])

  // Decode all fetched raw buffers into the AudioContext
  const decodeAll = useCallback((ctx) => {
    Object.entries(rawBuffers.current).forEach(([key, arr]) => {
      if (buffers.current[key] || !arr) return
      // slice so the ArrayBuffer isn't transferred/consumed
      ctx.decodeAudioData(arr.slice(0))
        .then(buf => { buffers.current[key] = buf })
        .catch(() => {})
    })
  }, [])

  // Create AudioContext and decode buffers — MUST be called inside a user gesture
  // so iOS creates the context in 'running' state, not 'suspended'.
  const unlock = useCallback(() => {
    if (ctxRef.current) {
      if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
      return
    }
    ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    decodeAll(ctxRef.current)
  }, [decodeAll])

  // Also decode newly-fetched buffers if context already exists
  useEffect(() => {
    if (ctxRef.current && Object.keys(rawBuffers.current).length) {
      decodeAll(ctxRef.current)
    }
  }, [filesReady, decodeAll])

  // Register unlock on first touch/click anywhere on the page
  useEffect(() => {
    document.addEventListener('touchstart', unlock, { once: true, passive: true })
    document.addEventListener('click',      unlock, { once: true })
    return () => {
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('click',      unlock)
    }
  }, [unlock])

  const playBuffer = useCallback((key, volume = 1.0, onEnded) => {
    const buf = buffers.current[key]
    const ctx = ctxRef.current
    if (!buf || !ctx || ctx.state !== 'running') return
    const source = ctx.createBufferSource()
    const gain   = ctx.createGain()
    gain.gain.value = volume
    source.buffer = buf
    source.connect(gain)
    gain.connect(ctx.destination)
    if (onEnded) source.onended = onEnded
    source.start()
  }, [])

  // ── Public API ───────────────────────────────
  const playPegHit = useCallback(() => {
    if (!sfxEnabled || !filesReady.pegHit) return
    const now = Date.now()
    if (now - lastHit.current < PEG_THROTTLE_MS) return
    if (pegVoices.current >= MAX_PEG_VOICES) return
    lastHit.current = now
    pegVoices.current++
    playBuffer('pegHit', 0.35, () => { pegVoices.current-- })
  }, [sfxEnabled, filesReady, playBuffer])

  const playBallLand = useCallback(() => {
    if (!sfxEnabled || !filesReady.ballLand) return
    playBuffer('ballLand', 0.7)
  }, [sfxEnabled, filesReady, playBuffer])

  const playFanfare = useCallback(() => {
    if (!sfxEnabled || !filesReady.fanfare) return
    playBuffer('fanfare', 1.0)
  }, [sfxEnabled, filesReady, playBuffer])

  const toggleSfx = useCallback(() => {
    unlock()
    setSfxEnabled(v => !v)
  }, [unlock])

  const toggleMusic = useCallback(() => {
    if (!filesReady.bgMusic) return
    setMusicEnabled(prev => {
      const next = !prev
      if (next) {
        if (!bgRef.current) {
          bgRef.current = new Audio(SOUND_FILES.bgMusic)
          bgRef.current.loop   = true
          bgRef.current.volume = 0.25
        }
        bgRef.current.play().catch(() => {})
      } else {
        bgRef.current?.pause()
      }
      return next
    })
  }, [filesReady])

  const anyFilesReady = Object.values(filesReady).some(Boolean)

  return {
    sfxEnabled, musicEnabled,
    filesReady, anyFilesReady,
    toggleSfx, toggleMusic,
    playPegHit, playBallLand, playFanfare,
  }
}
