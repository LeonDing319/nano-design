'use client'

import { useCallback } from 'react'
import { useAppState } from './useEffectParams'
import { useTranslations } from 'next-intl'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_VIDEO_TYPES = ['video/mp4']
const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES]

export const ACCEPT_STRING = 'image/jpeg,image/png,image/webp,video/mp4'

export function useImageUpload() {
  const { dispatch } = useAppState()
  const t = useTranslations('upload.error')

  const loadImage = useCallback((file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (file.size > MAX_IMAGE_SIZE) {
        reject(new Error(t('size')))
        return
      }
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error(t('load')))
      }
      img.src = url
    })
  }, [t])

  const loadVideo = useCallback((file: File): Promise<HTMLVideoElement> => {
    return new Promise((resolve, reject) => {
      if (file.size > MAX_VIDEO_SIZE) {
        reject(new Error(t('size')))
        return
      }
      const url = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.preload = 'auto'
      video.muted = true
      video.playsInline = true
      video.onloadeddata = () => resolve(video)
      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error(t('load')))
      }
      video.src = url
    })
  }, [t])

  const handleUpload = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      throw new Error(t('type'))
    }

    try {
      if (ACCEPTED_VIDEO_TYPES.includes(file.type)) {
        const video = await loadVideo(file)
        dispatch({ type: 'SET_VIDEO', payload: video })
      } else {
        const img = await loadImage(file)
        dispatch({ type: 'SET_IMAGE', payload: img })
      }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }, [loadImage, loadVideo, dispatch, t])

  return { handleUpload }
}
