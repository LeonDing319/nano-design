'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAppState } from '@/hooks/useEffectParams'
import { Play, Pause, Square } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface VideoControlsProps {
  video: HTMLVideoElement
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2]

export function VideoControls({ video }: VideoControlsProps) {
  const { state, dispatch } = useAppState()
  const { playing, currentTime, duration, speed, fps } = state.videoPlayback
  const t = useTranslations('videoControls')

  // FPS calculation
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(performance.now())
  const rafRef = useRef<number>(0)

  const measureFps = useCallback(() => {
    frameCountRef.current++
    const now = performance.now()
    const elapsed = now - lastFpsTimeRef.current
    if (elapsed >= 1000) {
      const measuredFps = Math.round((frameCountRef.current / elapsed) * 1000)
      dispatch({ type: 'SET_VIDEO_PLAYBACK', payload: { fps: measuredFps } })
      frameCountRef.current = 0
      lastFpsTimeRef.current = now
    }
    if (!video.paused) {
      rafRef.current = requestAnimationFrame(measureFps)
    }
  }, [video, dispatch])

  // Sync video events to state
  useEffect(() => {
    const onTimeUpdate = () => {
      dispatch({ type: 'SET_VIDEO_PLAYBACK', payload: { currentTime: video.currentTime } })
    }
    const onLoadedMetadata = () => {
      dispatch({ type: 'SET_VIDEO_PLAYBACK', payload: { duration: video.duration } })
    }
    const onPlay = () => {
      dispatch({ type: 'SET_VIDEO_PLAYBACK', payload: { playing: true } })
      frameCountRef.current = 0
      lastFpsTimeRef.current = performance.now()
      rafRef.current = requestAnimationFrame(measureFps)
    }
    const onPause = () => {
      dispatch({ type: 'SET_VIDEO_PLAYBACK', payload: { playing: false, fps: 0 } })
      cancelAnimationFrame(rafRef.current)
    }
    const onEnded = () => {
      dispatch({ type: 'SET_VIDEO_PLAYBACK', payload: { playing: false, fps: 0 } })
      cancelAnimationFrame(rafRef.current)
    }

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)

    // Init duration if already loaded
    if (video.duration && !isNaN(video.duration)) {
      dispatch({ type: 'SET_VIDEO_PLAYBACK', payload: { duration: video.duration } })
    }

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
      cancelAnimationFrame(rafRef.current)
    }
  }, [video, dispatch, measureFps])

  const handlePlayPause = () => {
    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }

  const handleStop = () => {
    video.pause()
    video.currentTime = 0
    dispatch({ type: 'SET_VIDEO_PLAYBACK', payload: { playing: false, currentTime: 0, fps: 0 } })
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    video.currentTime = value
    dispatch({ type: 'SET_VIDEO_PLAYBACK', payload: { currentTime: value } })
  }

  const handleSpeed = (newSpeed: number) => {
    video.playbackRate = newSpeed
    dispatch({ type: 'SET_VIDEO_PLAYBACK', payload: { speed: newSpeed } })
  }

  const iconStyle = { width: 14, height: 14, flexShrink: 0 } as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Play/Pause + Stop + Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          onClick={handlePlayPause}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 6,
            border: '1px solid var(--color-border-group)',
            backgroundColor: 'var(--color-bg-elevated)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
          }}
        >
          {playing
            ? <Pause style={iconStyle} />
            : <Play style={{ ...iconStyle, marginLeft: 1 }} />
          }
        </button>
        <button
          type="button"
          onClick={handleStop}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 6,
            border: '1px solid var(--color-border-group)',
            backgroundColor: 'var(--color-bg-elevated)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
          }}
        >
          <Square style={{ ...iconStyle, width: 12, height: 12 }} />
        </button>
        <span style={{ flex: 1, textAlign: 'right', fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Seek slider */}
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.01}
        value={currentTime}
        onChange={handleSeek}
        style={{
          width: '100%', height: 4, cursor: 'pointer',
          accentColor: 'var(--color-text-primary)',
        }}
      />

      {/* Speed + FPS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{t('speed')}</span>
          <div style={{ display: 'flex', gap: 2 }}>
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSpeed(s)}
                style={{
                  padding: '2px 6px', fontSize: 11, borderRadius: 4,
                  border: '1px solid',
                  borderColor: s === speed ? 'var(--color-text-primary)' : 'var(--color-border-group)',
                  backgroundColor: s === speed ? 'var(--color-text-primary)' : 'transparent',
                  color: s === speed ? 'var(--color-bg-elevated)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
          {t('fps')}: {fps}
        </span>
      </div>
    </div>
  )
}
