import type { JSX } from 'react'

import { LoginDialog } from '@/components/auth/login-dialog'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingHeader } from '@/components/landing/landing-header'
import { LandingHero } from '@/components/landing/landing-hero'
import { LandingToolsSection } from '@/components/landing/landing-tools-section'
import { useLandingPage } from '@/hooks/use-landing-page'

export function LandingPage(): JSX.Element {
  const {
    isDark,
    isToolsMenuOpen,
    isLoginDialogOpen,
    isAuthenticated,
    isSigningIn,
    user,
    authErrorMessage,
    tools,
    handleToggleLocale,
    handleToggleTheme,
    handleToggleToolsMenu,
    handleSignIn,
    handleToolSelect,
    handleCloseLoginDialog,
    handleExploreTools,
  } = useLandingPage()

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader
        isDark={isDark}
        isToolsMenuOpen={isToolsMenuOpen}
        isAuthenticated={isAuthenticated}
        user={user}
        tools={tools}
        onToggleLocale={handleToggleLocale}
        onToggleTheme={handleToggleTheme}
        onToggleToolsMenu={handleToggleToolsMenu}
        onToolSelect={handleToolSelect}
      />
      <main>
        <LandingHero
          isAuthenticated={isAuthenticated}
          isSigningIn={isSigningIn}
          authErrorMessage={authErrorMessage}
          onSignIn={handleSignIn}
          onExploreTools={handleExploreTools}
        />
        <LandingToolsSection tools={tools} onToolSelect={handleToolSelect} />
      </main>
      <LandingFooter />
      {isLoginDialogOpen ? (
        <LoginDialog
          isSigningIn={isSigningIn}
          errorMessage={authErrorMessage}
          onSignIn={handleSignIn}
          onClose={handleCloseLoginDialog}
        />
      ) : null}
    </div>
  )
}
