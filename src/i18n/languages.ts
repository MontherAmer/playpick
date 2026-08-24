export interface ILanguage {
  code: string
  /** Endonym — always shown in its own language, never translated. */
  label: string
  dir: 'ltr' | 'rtl'
}

export const LANGUAGES: readonly ILanguage[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
]

export const DEFAULT_LANGUAGE = 'en'

export const LANGUAGE_STORAGE_KEY = 'language'

export function normalizeLanguage(value: string | undefined | null): string {
  if (!value) return DEFAULT_LANGUAGE

  // Accept regional tags such as `ar-EG` by matching on the base subtag.
  const base = value.split('-')[0].toLowerCase()

  return LANGUAGES.some((language) => language.code === base) ? base : DEFAULT_LANGUAGE
}

export function getLanguageDirection(code: string): 'ltr' | 'rtl' {
  return LANGUAGES.find((language) => language.code === code)?.dir ?? 'ltr'
}
