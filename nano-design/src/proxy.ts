import { NextRequest, NextResponse } from 'next/server'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/i18n/config'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale
  const first = acceptLanguage.split(',')[0]?.trim().toLowerCase() ?? ''
  if (first.startsWith('zh')) return 'zh'
  if (first.startsWith('en')) return 'en'
  return defaultLocale
}

export function proxy(request: NextRequest) {
  const existing = request.cookies.get(localeCookieName)?.value
  if (isLocale(existing)) {
    return NextResponse.next()
  }

  const locale = detectLocale(request.headers.get('accept-language'))
  const response = NextResponse.next()
  response.cookies.set(localeCookieName, locale, {
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
    path: '/',
  })
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.).*)'],
}
