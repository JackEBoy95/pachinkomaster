import { useRef, useCallback, useState, useEffect } from 'react'

const SOUND_FILES = {
  pegHit:    '/sounds/mixkit-neutral-bot-pinbal-tone-3137.wav',
  ballLand:  '/sounds/ball-land.mp3',
  fanfare:   '/sounds/mixkit-happy-crowd-cheer-975.wav',
  bgMusic:   '/sounds/bg-music.mp3',
}

const MAX_PEG_VOICES  = 7
const PEG_DEDUP_MS   = 10  // collapse simultaneous peg hits into one sound

export function useSound() {
  const [sfxEnabled, setSfxEnabled]     = useState(true)
  const [musicEnabled, setMusicEnabled] = useState(false)
  const [filesReady, setFilesReady]     = useState({})

  // Refs so audio callbacks never change identity when state toggles —
  // prevents physics world from rebuilding when sound is toggled mid-drop.
  const sfxEnabledRef  = useRef(sfxEnabled)
  const filesReadyRef  = useRef(filesReady)
  useEffect(() => { sfxEnabledRef.current  = sfxEnabled  }, [sfxEnabled])
  useEffect(() => { filesReadyRef.current  = filesReady  }, [filesReady])

  const rawBuffers   = useRef({})
  const buffers      = useRef({})
  const ctxRef       = useRef(null)
  const bgRef        = useRef(null)
  const pegVoices    = useRef(0)
  const lastPegHitMs = useRef(0)  // timestamp of most-recent peg-hit play

  // Fetch raw bytes (no AudioContext needed)
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

  const decodeAll = useCallback((ctx) => {
    Object.entries(rawBuffers.current).forEach(([key, arr]) => {
      if (buffers.current[key] || !arr) return
      ctx.decodeAudioData(arr.slice(0))
        .then(buf => { buffers.current[key] = buf })
        .catch(() => {})
    })
  }, [])

  // Decode any newly-fetched buffers if context already exists
  useEffect(() => {
    if (ctxRef.current) decodeAll(ctxRef.current)
  }, [filesReady, decodeAll])

  // Create AudioContext inside a user gesture so iOS starts it 'running'
  const unlock = useCallback(() => {
    if (ctxRef.current) {
      if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
      return
    }
    ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    decodeAll(ctxRef.current)
  }, [decodeAll])

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

  // ── Public API — stable references, read state via refs ─────────────────
  const playPegHit = useCallback(() => {
    if (!sfxEnabledRef.current || !filesReadyRef.current.pegHit) return
    // Deduplicate: multiple balls hitting pegs within PEG_DEDUP_MS play as one sound
    const now = performance.now()
    if (now - lastPegHitMs.current < PEG_DEDUP_MS) return
    lastPegHitMs.current = now
    if (pegVoices.current >= MAX_PEG_VOICES) return
    pegVoices.current++
    playBuffer('pegHit', 0.35, () => { pegVoices.current-- })
  }, [playBuffer])  // no sfxEnabled/filesReady in deps → stable reference

  const playBallLand = useCallback(() => {
    if (!sfxEnabledRef.current || !filesReadyRef.current.ballLand) return
    playBuffer('ballLand', 0.7)
  }, [playBuffer])

  const playFanfare = useCallback(() => {
    if (!sfxEnabledRef.current || !filesReadyRef.current.fanfare) return
    playBuffer('fanfare', 1.0)
  }, [playBuffer])

  const toggleSfx = useCallback(() => {
    unlock()
    setSfxEnabled(v => !v)
  }, [unlock])

  const toggleMusic = useCallback(() => {
    if (!filesReadyRef.current.bgMusic) return
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
  }, [unlock])

  const anyFilesReady = Object.values(filesReady).some(Boolean)

  return {
    sfxEnabled, musicEnabled,
    filesReady, anyFilesReady,
    toggleSfx, toggleMusic,
    playPegHit, playBallLand, playFanfare,
  }
}
