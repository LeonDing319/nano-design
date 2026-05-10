import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import { Analytics } from '@vercel/analytics/react'
import { AppProvider } from '@/components/AppProvider'
import { defaultLocale, isLocale, localeCookieName } from '@/i18n/config'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nano Design',
  description: 'Image Art Effect Generator',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(localeCookieName)?.value
  const locale = isLocale(cookieValue) ? cookieValue : defaultLocale

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <AppProvider initialLocale={locale}>
          {children}
        </AppProvider>
        <Analytics />
      </body>
    </html>
  )
}
