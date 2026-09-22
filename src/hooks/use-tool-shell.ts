import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/hooks/use-auth'
import { getAlternateLanguage } from '@/i18n/languages'
import type { ToolId } from '@/models/landing.interface'
import { getToolRoute } from '@/routes'

export function useToolShell() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const auth = useAuth()
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  const handleToggleLocale = (): void => {
    const language = getAlternateLanguage(i18n.resolvedLanguage ?? i18n.language)
    void i18n.changeLanguage(language.code)
  }

  const handleToolSelect = (toolId: ToolId): void => {
    setIsToolsMenuOpen(false)
    void navigate(getToolRoute(toolId))
  }

  return {
    ...auth,
    isDark,
    isToolsMenuOpen,
    handleToggleLocale,
    handleToggleTheme: () => setIsDark((current) => !current),
    handleToggleToolsMenu: () => setIsToolsMenuOpen((current) => !current),
    handleToolSelect,
  }
}
