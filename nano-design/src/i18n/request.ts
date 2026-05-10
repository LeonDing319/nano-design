import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, isLocale, localeCookieName } from './config'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(localeCookieName)?.value
  const locale = isLocale(cookieValue) ? cookieValue : defaultLocale
  const messages = (await import(`./${locale}.json`)).default

  return {
    locale,
    messages,
  }
})
