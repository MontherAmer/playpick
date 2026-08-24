import { ChevronDown } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { LANGUAGES, normalizeLanguage } from '@i18n/languages'
import { cn } from '@/utils/cn'

interface LanguageSwitcherProps {
  className?: string
}

/**
 * A native <select> rather than a custom listbox: it is keyboard and
 * screen-reader accessible for free, and uses the platform picker on mobile.
 */
export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()

  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    void i18n.changeLanguage(event.target.value)
  }

  return (
    <div className={cn('relative', className)}>
      <select
        value={currentLanguage}
        onChange={handleChange}
        aria-label={t('common.language')}
        className="h-10 w-full appearance-none rounded-md border border-input bg-background ps-3 pe-9 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>

      <ChevronDown
        className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
}
