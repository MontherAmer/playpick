import { useEffect, useState } from 'react'

import { AUTH_COPY, AUTH_ERROR_MESSAGES, type IAuthCopy } from '@/constants/auth.constants'
import { LANDING_COPY, LANDING_TOOLS } from '@/constants/landing.constants'
import { useAuth } from '@/hooks/use-auth'
import type { ILandingCopy, Locale, ToolId } from '@/models/landing.interface'
import type { IUser } from '@/models/user.interface'

interface IUseLandingPageResult {
  locale: Locale
  isDark: boolean
  isToolsMenuOpen: boolean
  isLoginDialogOpen: boolean
  isAuthenticated: boolean
  isSigningIn: boolean
  user: IUser | null
  copy: ILandingCopy
  authCopy: IAuthCopy
  authErrorMessage: string | null
  tools: typeof LANDING_TOOLS
  handleToggleLocale: () => void
  handleToggleTheme: () => void
  handleToggleToolsMenu: () => void
  handleCloseToolsMenu: () => void
  handleSignIn: () => void
  handleToolSelect: (toolId: ToolId) => void
  handleCloseLoginDialog: () => void
  handleExploreTools: () => void
}

export function useLandingPage(): IUseLandingPageResult {
  const { status, isAuthenticated, user, error, signIn } = useAuth()
  const [locale, setLocale] = useState<Locale>('en')
  const [isDark, setIsDark] = useState(false)
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

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
    locale,
    isDark,
    isToolsMenuOpen,
    isLoginDialogOpen: isLoginDialogOpen && !isAuthenticated,
    isAuthenticated,
    isSigningIn: status === 'signingIn',
    user,
    copy: LANDING_COPY[locale],
    authCopy: AUTH_COPY[locale],
    authErrorMessage: error ? AUTH_ERROR_MESSAGES[locale][error] : null,
    tools: LANDING_TOOLS,
    handleToggleLocale,
    handleToggleTheme,
    handleToggleToolsMenu,
    handleCloseToolsMenu,
    handleSignIn,
    handleToolSelect,
    handleCloseLoginDialog,
    handleExploreTools,
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
