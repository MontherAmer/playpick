import { useEffect, useState } from 'react'

import { LANDING_COPY, LANDING_TOOLS } from '@/constants/landing.constants'
import type { ILandingCopy, Locale } from '@/models/landing.interface'

interface IUseLandingPageResult {
  locale: Locale
  isDark: boolean
  isToolsMenuOpen: boolean
  copy: ILandingCopy
  tools: typeof LANDING_TOOLS
  handleToggleLocale: () => void
  handleToggleTheme: () => void
  handleToggleToolsMenu: () => void
  handleCloseToolsMenu: () => void
}

export function useLandingPage(): IUseLandingPageResult {
  const [locale, setLocale] = useState<Locale>('en')
  const [isDark, setIsDark] = useState(false)
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false)

  useEffect(() => {
    synchronizeDocumentPreferences({ locale, isDark })
  }, [locale, isDark])

  const handleToggleLocale = (): void => {
    setLocale((currentLocale) => (currentLocale === 'en' ? 'ar' : 'en'))
  }

  const handleToggleTheme = (): void => {
    setIsDark((currentIsDark) => !currentIsDark)
  }

  const handleToggleToolsMenu = (): void => {
    setIsToolsMenuOpen((currentIsOpen) => !currentIsOpen)
  }

  const handleCloseToolsMenu = (): void => {
    setIsToolsMenuOpen(false)
  }

  return {
    locale,
    isDark,
    isToolsMenuOpen,
    copy: LANDING_COPY[locale],
    tools: LANDING_TOOLS,
    handleToggleLocale,
    handleToggleTheme,
    handleToggleToolsMenu,
    handleCloseToolsMenu,
  }
}

function synchronizeDocumentPreferences({
  locale,
  isDark,
}: {
  locale: Locale
  isDark: boolean
}): void {
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = locale
}
