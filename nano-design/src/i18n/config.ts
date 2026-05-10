export const locales = ['zh', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'zh'
export const localeCookieName = 'nano_locale'

export function isLocale(value: unknown): value is Locale {
  return value === 'zh' || value === 'en'
}
