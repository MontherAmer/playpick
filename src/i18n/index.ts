import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import ar from '@i18n/locales/ar.json'
import en from '@i18n/locales/en.json'
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, getLanguageDirection, normalizeLanguage } from '@i18n/languages'

const storedLanguage = normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY))

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    ar: {
      translation: ar,
    },
  },
  lng: storedLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
})

/**
 * Keep the document in sync with the active language so that CSS logical
 * properties (ms/me/ps/pe/start/end) and the `rtl:` variant resolve correctly.
 */
function syncDocumentLanguage(language: string): void {
  const code = normalizeLanguage(language)

  document.documentElement.lang = code
  document.documentElement.dir = getLanguageDirection(code)

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
  } catch {
    // Storage can be unavailable (private mode, blocked cookies) — the app still works.
  }
}

syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language)
i18n.on('languageChanged', syncDocumentLanguage)

export default i18n
