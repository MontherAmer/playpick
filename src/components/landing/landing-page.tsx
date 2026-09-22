import type { JSX } from 'react'

import { LoginDialog } from '@/components/auth/login-dialog'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingHeader } from '@/components/landing/landing-header'
import { LandingHero } from '@/components/landing/landing-hero'
import { LandingToolsSection } from '@/components/landing/landing-tools-section'
import { useLandingPage } from '@/hooks/use-landing-page'

export function LandingPage(): JSX.Element {
  const {
    locale,
    isDark,
    isToolsMenuOpen,
    isLoginDialogOpen,
    isAuthenticated,
    isSigningIn,
    user,
    copy,
    authCopy,
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
        locale={locale}
        isDark={isDark}
        isToolsMenuOpen={isToolsMenuOpen}
        isAuthenticated={isAuthenticated}
        user={user}
        copy={copy}
        tools={tools}
        onToggleLocale={handleToggleLocale}
        onToggleTheme={handleToggleTheme}
        onToggleToolsMenu={handleToggleToolsMenu}
        onToolSelect={handleToolSelect}
      />
      <main>
        <LandingHero
          copy={copy}
          isAuthenticated={isAuthenticated}
          isSigningIn={isSigningIn}
          continueLabel={authCopy.continue}
          connectingLabel={authCopy.connecting}
          goToToolsLabel={authCopy.goToTools}
          authErrorMessage={authErrorMessage}
          onSignIn={handleSignIn}
          onExploreTools={handleExploreTools}
        />
        <LandingToolsSection
          locale={locale}
          copy={copy}
          tools={tools}
          onToolSelect={handleToolSelect}
        />
      </main>
      <LandingFooter copy={copy} />
      {isLoginDialogOpen ? (
        <LoginDialog
          title={authCopy.loginTitle}
          description={authCopy.loginDescription}
          continueLabel={authCopy.continue}
          connectingLabel={authCopy.connecting}
          privacy={authCopy.privacy}
          closeLabel={authCopy.close}
          isSigningIn={isSigningIn}
          errorMessage={authErrorMessage}
          onSignIn={handleSignIn}
          onClose={handleCloseLoginDialog}
        />
      ) : null}
    </div>
  )
}
