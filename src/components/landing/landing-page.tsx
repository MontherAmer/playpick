import type { JSX } from 'react'

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
    copy,
    tools,
    handleToggleLocale,
    handleToggleTheme,
    handleToggleToolsMenu,
    handleCloseToolsMenu,
  } = useLandingPage()

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader
        locale={locale}
        isDark={isDark}
        isToolsMenuOpen={isToolsMenuOpen}
        copy={copy}
        tools={tools}
        onToggleLocale={handleToggleLocale}
        onToggleTheme={handleToggleTheme}
        onToggleToolsMenu={handleToggleToolsMenu}
        onCloseToolsMenu={handleCloseToolsMenu}
      />
      <main>
        <LandingHero copy={copy} />
        <LandingToolsSection locale={locale} copy={copy} tools={tools} />
      </main>
      <LandingFooter copy={copy} />
    </div>
  )
}
