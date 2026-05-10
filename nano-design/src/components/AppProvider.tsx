'use client'

import { ReactNode, useEffect, useMemo } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { AppContext, useAppReducer } from '@/hooks/useEffectParams'
import { localeCookieName, type Locale } from '@/i18n/config'
import zh from '@/i18n/zh.json'
import en from '@/i18n/en.json'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

const messagesMap = { zh, en } as const

export function AppProvider({
  children,
  initialLocale = 'zh',
}: {
  children: ReactNode
  initialLocale?: Locale
}) {
  const [state, dispatch] = useAppReducer(initialLocale)
  const messages = useMemo(() => messagesMap[state.locale], [state.locale])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.cookie = `${localeCookieName}=${state.locale}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`
    document.documentElement.lang = state.locale
  }, [state.locale])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <NextIntlClientProvider locale={state.locale} messages={messages} timeZone="Asia/Shanghai">
        {children}
      </NextIntlClientProvider>
    </AppContext.Provider>
  )
}
