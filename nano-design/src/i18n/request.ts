import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async () => {
  const locale = 'en' // SSG default, client will detect and switch
  return {
    locale,
    messages: (await import(`./${locale}.json`)).default,
  }
})
