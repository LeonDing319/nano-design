'use client'

import { ReactNode, useEffect } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { AppContext, useAppReducer } from '@/hooks/useEffectParams'
import { getDefaultLocale } from '@/i18n/config'
import en from '@/i18n/en.json'
import zh from '@/i18n/zh.json'

const messages = { en, zh } as const

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useAppReducer()

  useEffect(() => {
    const locale = getDefaultLocale()
    dispatch({ type: 'SET_LOCALE', payload: locale })
  }, [dispatch])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <NextIntlClientProvider locale={state.locale} messages={messages[state.locale]} timeZone="Asia/Shanghai">
        {children}
      </NextIntlClientProvider>
    </AppContext.Provider>
  )
}
