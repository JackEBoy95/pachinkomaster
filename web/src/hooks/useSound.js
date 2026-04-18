import { useRef, useCallback, useState, useEffect } from 'react'

const SOUND_FILES = {
  pegHit:    '/sounds/peg-hit.mp3',
  ballLand:  '/sounds/ball-land.mp3',
  fanfare:   '/sounds/result-fanfare.mp3',
  bgMusic:   '/sounds/bg-music.mp3',
}

export function useSound() {
  const [sfxEnabled, setSfxEnabled]     = useState(false)
  const [musicEnabled, setMusicEnabled] = useState(false)
  const [filesReady, setFilesReady]     = useState({})

  const buffers  = useRef({})
  const ctxRef   = useRef(null)
  const bgRef    = useRef(null)   // background music Audio element
  const lastHit  = useRef(0)      // throttle peg hits

  // Check which sound files actually exist
  useEffect(() => {
    const checks = Object.entries(SOUND_FILES).map(async ([key, path]) => {
      try {
        const res = await fetch(path, { method: 'HEAD' })
        return [key, res.ok]
      } catch {
        return [key, false]
      }
    })
    Promise.all(checks).then(results => {
      setFilesReady(Object.fromEntries(results))
    })
  }, [])

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return ctxRef.current
  }, [])

  const loadBuffer = useCallback(async (key) => {
    if (buffers.current[key]) return buffers.current[key]
    if (!filesReady[key]) return null
    try {
      const ctx = getCtx()
      const res = await fetch(SOUND_FILES[key])
      const arr = await res.arrayBuffer()
      const buf = await ctx.decodeAudioData(arr)
      buffers.current[key] = buf
      return buf
    } catch {
      return null
    }
  }, [filesReady, getCtx])

  const playBuffer = useCallback(async (key, volume = 1.0) => {
    const buf = await loadBuffer(key)
    if (!buf) return
    const ctx = getCtx()
    if (ctx.state === 'suspended') await ctx.resume()
    const source = ctx.createBufferSource()
    const gain   = ctx.createGain()
    gain.gain.value = volume
    source.buffer = buf
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  }, [loadBuffer, getCtx])

  // ── Public API ──────────────────────────────
  const playPegHit = useCallback(() => {
    if (!sfxEnabled || !filesReady.pegHit) return
    const now = Date.now()
    if (now - lastHit.current < 60) return  // throttle rapid hits
    lastHit.current = now
    playBuffer('pegHit', 0.4)
  }, [sfxEnabled, filesReady, playBuffer])

  const playBallLand = useCallback(() => {
    if (!sfxEnabled || !filesReady.ballLand) return
    playBuffer('ballLand', 0.8)
  }, [sfxEnabled, filesReady, playBuffer])

  const playFanfare = useCallback(() => {
    if (!sfxEnabled || !filesReady.fanfare) return
    playBuffer('fanfare', 1.0)
  }, [sfxEnabled, filesReady, playBuffer])

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

  const toggleSfx = useCallback(() => setSfxEnabled(v => !v), [])

  const anyFilesReady = Object.values(filesReady).some(Boolean)

  return {
    sfxEnabled, musicEnabled,
    filesReady, anyFilesReady,
    toggleSfx, toggleMusic,
    playPegHit, playBallLand, playFanfare,
  }
}
