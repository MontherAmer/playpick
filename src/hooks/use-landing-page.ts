import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { LANDING_TOOLS } from '@/constants/landing.constants'
import { useAuth } from '@/hooks/use-auth'
import { getAlternateLanguage } from '@/i18n/languages'
import type { ToolId } from '@/models/landing.interface'
import type { IUser } from '@/models/user.interface'
import { getToolRoute } from '@/routes'

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
  const navigate = useNavigate()
  const { status, isAuthenticated, user, error, signIn } = useAuth()
  const [isDark, setIsDark] = useState(false)
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [pendingToolId, setPendingToolId] = useState<ToolId | null>(null)

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

    setPendingToolId(null)
    setIsLoginDialogOpen(false)
  }

  const handleSignIn = (): void => {
    // Must stay in the click's call stack — GSI opens a popup, which browsers
    // only allow while a user gesture is being handled.
    void signIn().then((didSignIn) => {
      if (!didSignIn) {
        return
      }

      setIsLoginDialogOpen(false)

      if (pendingToolId) {
        const toolId = pendingToolId
        setPendingToolId(null)
        void navigate(getToolRoute(toolId))
      }
    })
  }

  const handleToolSelect = (toolId: ToolId): void => {
    setIsToolsMenuOpen(false)

    if (!isAuthenticated) {
      setPendingToolId(toolId)
      setIsLoginDialogOpen(true)
      return
    }

    void navigate(getToolRoute(toolId))
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
