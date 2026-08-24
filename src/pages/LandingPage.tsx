import { ArrowRight, LayoutDashboard, Loader2, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import { GitHubIcon } from '@/components/brand/GitHubIcon'
import { GoogleIcon } from '@/components/brand/GoogleIcon'
import { Logo } from '@/components/brand/Logo'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { useAuth } from '@/features/auth/useAuth'
import { ROUTES } from '@/routes'

export function LandingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { status, isAuthenticated, error, signIn } = useAuth()

  const isSigningIn = status === 'signingIn'

  const handleConnect = async () => {
    if (isAuthenticated) {
      void navigate(ROUTES.dashboard)
      return
    }

    // Must stay in the click's call stack — GSI opens a popup, which browsers
    // only allow while a user gesture is being handled.
    if (await signIn()) {
      void navigate(ROUTES.dashboard)
    }
  }

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden">
      {/* Soft brand tint at the top */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 0%, color-mix(in srgb, var(--brand) 8%, transparent), transparent 70%)',
        }}
      />

      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to={ROUTES.landing}
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <Logo />
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="min-w-[120px]" />

          {/* TODO: point at the real PlayPick repository once it is published. */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            aria-label={t('nav.github')}
            className={buttonStyles({ variant: 'ghost', size: 'icon' })}>
            <GitHubIcon className="h-5 w-5" />
          </a>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 pt-8 pb-16 text-center sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-muted px-3 py-1 text-xs font-medium text-brand">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {t('landing.badge')}
        </span>

        <h1 className="mt-6 max-w-3xl text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">
          {t('landing.hero.title')}
        </h1>

        <p className="mt-4 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
          {t('landing.hero.subtitle')}
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <Button
            variant="brand"
            size="lg"
            onClick={() => void handleConnect()}
            disabled={isSigningIn}
            className="h-12 gap-3 px-6 text-base">
            {isSigningIn ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : isAuthenticated ? (
              <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            ) : (
              <GoogleIcon className="h-5 w-5" />
            )}

            {isSigningIn ? t('auth.connecting') : isAuthenticated ? t('nav.dashboard') : t('auth.connect')}

            {!isSigningIn && !isAuthenticated && <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />}
          </Button>

          {error ? (
            <p role="alert" className="max-w-md text-sm font-medium text-destructive">
              {t(`errors.auth.${error}`)}
            </p>
          ) : (
            <p className="max-w-md text-sm text-muted-foreground">{t('landing.permission')}</p>
          )}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
        <p className="text-center text-xs text-muted-foreground">
          {t('app.name')} · {t('app.tagline')}
        </p>
      </footer>
    </div>
  )
}
