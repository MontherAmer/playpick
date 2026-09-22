import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LANDING_TOOLS } from '@/constants/landing.constants'
import { useAuth } from '@/hooks/use-auth'
import { getAlternateLanguage } from '@/i18n/languages'
import type { ToolId } from '@/models/landing.interface'
import type { IUser } from '@/models/user.interface'

interface IUseLandingPageResult {
  isDark: boolean
  isToolsMenuOpen: boolean
  isLoginDialogOpen: boolean
  isAuthenticated: boolean
  isSigningIn: boolean
  user: IUser | null
  authErrorMessage: string | null
  tools: typeof LANDING_TOOLS
  handleToggleLocale: () => void
  handleToggleTheme: () => void
  handleToggleToolsMenu: () => void
  handleSignIn: () => void
  handleToolSelect: (toolId: ToolId) => void
  handleCloseLoginDialog: () => void
  handleExploreTools: () => void
}

export function useLandingPage(): IUseLandingPageResult {
  const { t, i18n } = useTranslation()
  const { status, isAuthenticated, user, error, signIn } = useAuth()
  const [isDark, setIsDark] = useState(false)
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  const handleToggleLocale = (): void => {
    const nextLanguage = getAlternateLanguage(i18n.resolvedLanguage ?? i18n.language)
    void i18n.changeLanguage(nextLanguage.code)
  }

  const handleToggleTheme = (): void => {
    setIsDark((currentIsDark) => !currentIsDark)
  }

  const handleToggleToolsMenu = (): void => {
    setIsToolsMenuOpen((currentIsOpen) => !currentIsOpen)
  }

  const handleCloseLoginDialog = (): void => {
    if (status === 'signingIn') {
      return
    }

    setIsLoginDialogOpen(false)
  }

  const handleSignIn = (): void => {
    // Must stay in the click's call stack — GSI opens a popup, which browsers
    // only allow while a user gesture is being handled.
    void signIn().then((didSignIn) => {
      if (didSignIn) {
        setIsLoginDialogOpen(false)
      }
    })
  }

  const handleToolSelect = (toolId: ToolId): void => {
    setIsToolsMenuOpen(false)

    if (!isAuthenticated) {
      setIsLoginDialogOpen(true)
      return
    }

    const toolAnchor = document.getElementById(toolId)

    if (toolAnchor) {
      toolAnchor.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }

    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleExploreTools = (): void => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return {
    isDark,
    isToolsMenuOpen,
    isLoginDialogOpen: isLoginDialogOpen && !isAuthenticated,
    isAuthenticated,
    isSigningIn: status === 'signingIn',
    user,
    authErrorMessage: error ? t(`errors.auth.${error}`) : null,
    tools: LANDING_TOOLS,
    handleToggleLocale,
    handleToggleTheme,
    handleToggleToolsMenu,
    handleSignIn,
    handleToolSelect,
    handleCloseLoginDialog,
    handleExploreTools,
  }
}
