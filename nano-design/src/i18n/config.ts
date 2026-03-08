export const locales = ['en', 'zh'] as const
export type Locale = (typeof locales)[number]

export function getDefaultLocale(): Locale {
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language.toLowerCase()
    if (lang.startsWith('zh')) return 'zh'
  }
  return 'en'
}
