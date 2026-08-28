import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { buttonStyles } from '@/components/ui/buttonStyles'
import { getAlternateLanguage } from '@i18n/languages'

interface LanguageSwitcherProps {
  className?: string
}

/**
 * A single button labelled with the language it switches *to*, so there is
 * nothing to open and nothing to read first. With exactly two languages, a list
 * would be a menu with one real choice in it.
 *
 * The visible endonym is deliberately the accessible name, with no aria-label:
 * an aria-label of "Switch to Arabic" over a button reading "العربية" fails
 * WCAG 2.5.3 (Label in Name). `title` adds context as a description instead,
 * read after the name rather than displacing it.
 */
export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()

  const alternate = getAlternateLanguage(i18n.resolvedLanguage ?? i18n.language)

  const handleClick = () => {
    // Persistence and the <html lang>/<html dir> sync are already handled by the
    // languageChanged listener in src/i18n/index.ts — not duplicated here.
    void i18n.changeLanguage(alternate.code)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={t('common.switchLanguage')}
      className={buttonStyles({ variant: 'outline', className })}>
      <Languages className="h-4 w-4" aria-hidden="true" />

      {/* `lang` so a screen reader pronounces the endonym with the right
          phoneme set instead of reading it through the current UI voice. */}
      <span lang={alternate.code}>{alternate.label}</span>
    </button>
  )
}
