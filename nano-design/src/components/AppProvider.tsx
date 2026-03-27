'use client'

import { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { AppContext, useAppReducer } from '@/hooks/useEffectParams'
import zh from '@/i18n/zh.json'

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useAppReducer()

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <NextIntlClientProvider locale="zh" messages={zh} timeZone="Asia/Shanghai">
        {children}
      </NextIntlClientProvider>
    </AppContext.Provider>
  )
}
