'use client'

import { useEffect } from 'react'
import { useAppState } from '@/hooks/useEffectParams'
import { Play, Pause } from 'lucide-react'

interface VideoControlsProps {
  video: HTMLVideoElement
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2]

export function VideoControls({ video }: VideoControlsProps) {
  const { state, dispatch } = useAppState()
  const { playing, speed } = state.videoPlayback
  // Sync video events to state
  useEffect(() => {
    const onPlay = () => {
      dispatch({ type: 'SET_VIDEO_PLAYBACK', payload: { playing: true } })
    }
    const onPause = () => {
      dispatch({ type: 'SET_VIDEO_PLAYBACK', payload: { playing: false } })
    }
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [video, dispatch])

  const handlePlayPause = () => {
    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }

  const handleSpeed = (newSpeed: number) => {
    video.playbackRate = newSpeed
    dispatch({ type: 'SET_VIDEO_PLAYBACK', payload: { speed: newSpeed } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Play/Pause + Speed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          onClick={handlePlayPause}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: '50%',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          {playing
            ? <Pause style={{ width: 18, height: 18 }} />
            : <Play style={{ width: 18, height: 18, marginLeft: 2 }} />
          }
        </button>
        <div style={{ display: 'flex', gap: 6, marginLeft: 6 }}>
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSpeed(s)}
                className={`border cursor-pointer flex items-center justify-center ${
                  s === speed
                    ? 'text-blue-500 border-blue-500 bg-blue-500/15'
                    : 'text-neutral-400 border-neutral-700 bg-transparent'
                }`}
                style={{ width: 36, height: 28, borderRadius: 6, fontSize: 11 }}
              >
                {s}x
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
