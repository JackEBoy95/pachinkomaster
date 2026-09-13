import { useRef, useCallback, useState, useEffect } from 'react'

const SOUND_FILES = {
  pegHit:    '/sounds/mixkit-neutral-bot-pinbal-tone-3137.wav',
  ballLand:  '/sounds/ball-land.mp3',
  fanfare:   '/sounds/mixkit-happy-crowd-cheer-975.wav',
  bgMusic:   '/sounds/bg-music.mp3',
}

export function useSound() {
  const [sfxEnabled, setSfxEnabled]     = useState(true)
  const [musicEnabled, setMusicEnabled] = useState(false)
  const [filesReady, setFilesReady]     = useState({})

  const buffers  = useRef({})
  const ctxRef   = useRef(null)
  const bgRef    = useRef(null)
  const lastHit  = useRef(0)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return ctxRef.current
  }, [])

  // Unlock AudioContext on the first user touch/click — required on iOS/Android.
  // Must happen synchronously inside the event handler to stay within the
  // browser's user-activation window.
  useEffect(() => {
    const unlock = () => {
      const ctx = getCtx()
      if (ctx.state === 'suspended') ctx.resume()
    }
    document.addEventListener('touchstart', unlock, { once: true, passive: true })
    document.addEventListener('click',      unlock, { once: true })
    return () => {
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('click',      unlock)
    }
  }, [getCtx])

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
    Promise.all(checks).then(results => setFilesReady(Object.fromEntries(results)))
  }, [])

  // Eagerly decode all available buffers so playback is fully synchronous.
  useEffect(() => {
    const ctx = getCtx()
    Object.entries(filesReady).forEach(([key, ready]) => {
      if (!ready || buffers.current[key]) return
      fetch(SOUND_FILES[key])
        .then(r => r.arrayBuffer())
        .then(arr => ctx.decodeAudioData(arr))
        .then(buf => { buffers.current[key] = buf })
        .catch(() => {})
    })
  }, [filesReady, getCtx])

  // Synchronous — relies on buffers being pre-loaded above.
  const playBuffer = useCallback((key, volume = 1.0) => {
    const buf = buffers.current[key]
    if (!buf) return
    const ctx = getCtx()
    if (ctx.state === 'suspended') return  // not yet unlocked
    const source = ctx.createBufferSource()
    const gain   = ctx.createGain()
    gain.gain.value = volume
    source.buffer = buf
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  }, [getCtx])

  // ── Public API ───────────────────────────────
  const playPegHit = useCallback(() => {
    if (!sfxEnabled || !filesReady.pegHit) return
    const now = Date.now()
    if (now - lastHit.current < 60) return
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

  const toggleSfx = useCallback(() => {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
    setSfxEnabled(v => !v)
  }, [getCtx])

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
