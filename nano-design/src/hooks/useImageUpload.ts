'use client'

import { useCallback } from 'react'
import { useAppState } from './useEffectParams'
import { useTranslations } from 'next-intl'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function useImageUpload() {
  const { dispatch } = useAppState()
  const t = useTranslations('upload.error')

  const loadImage = useCallback((file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        reject(new Error(t('type')))
        return
      }
      if (file.size > MAX_FILE_SIZE) {
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

  const handleUpload = useCallback(async (file: File) => {
    try {
      const img = await loadImage(file)
      dispatch({ type: 'SET_IMAGE', payload: img })
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }, [loadImage, dispatch])

  return { handleUpload }
}
