'use client'

import { useReducer, createContext, useContext } from 'react'
import { AppState, EffectType, GlitchParams, AsciiParams } from '@/types'
import { DEFAULT_GLITCH_PARAMS } from '@/presets/glitch-presets'
import { DEFAULT_ASCII_PARAMS } from '@/presets/ascii-presets'

type Action =
  | { type: 'SET_IMAGE'; payload: HTMLImageElement | null }
  | { type: 'SET_EFFECT'; payload: EffectType }
  | { type: 'SET_GLITCH_PARAMS'; payload: Partial<GlitchParams> }
  | { type: 'SET_ASCII_PARAMS'; payload: Partial<AsciiParams> }
  | { type: 'SET_GLITCH_PRESET'; payload: GlitchParams }
  | { type: 'SET_ASCII_PRESET'; payload: AsciiParams }
  | { type: 'SET_LOCALE'; payload: 'zh' | 'en' }
  | { type: 'SET_THEME'; payload: 'dark' | 'light' }

const initialState: AppState = {
  image: null,
  activeEffect: 'glitch',
  glitchParams: DEFAULT_GLITCH_PARAMS,
  asciiParams: DEFAULT_ASCII_PARAMS,
  locale: 'en',
  theme: 'dark',
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_IMAGE':
      return { ...state, image: action.payload }
    case 'SET_EFFECT':
      return { ...state, activeEffect: action.payload }
    case 'SET_GLITCH_PARAMS':
      return { ...state, glitchParams: { ...state.glitchParams, ...action.payload } }
    case 'SET_ASCII_PARAMS':
      return { ...state, asciiParams: { ...state.asciiParams, ...action.payload } }
    case 'SET_GLITCH_PRESET':
      return { ...state, glitchParams: action.payload }
    case 'SET_ASCII_PRESET':
      return { ...state, asciiParams: action.payload }
    case 'SET_LOCALE':
      return { ...state, locale: action.payload }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
}

export const AppContext = createContext<AppContextType | null>(null)

export function useAppState() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppState must be used within AppProvider')
  return context
}

export function useAppReducer() {
  return useReducer(reducer, initialState)
}
