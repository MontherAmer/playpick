import type { JSX } from 'react'

import { useTranslation } from 'react-i18next'

import { Logo } from '@/components/logo'

export function LandingFooter(): JSX.Element {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />
        <p>{t('landing.footerTagline')}</p>
        <div className="flex gap-5">
          <span>{t('landing.privacyLink')}</span>
          <span>{t('landing.termsLink')}</span>
          <span>{t('landing.helpLink')}</span>
        </div>
      </div>
    </footer>
  )
}
