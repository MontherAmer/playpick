import type { JSX } from 'react'

import { ArrowRight, Copy, LayoutDashboard, ShieldCheck, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ContinueWithGoogleButton } from '@/components/auth/continue-with-google-button'
import { MiniVideo } from '@/components/landing/mini-video'
import { Button } from '@/components/ui/button'
import {
  PREVIEW_READY_CHANGES,
  PREVIEW_VIDEOS,
} from '@/constants/landing.constants'

interface ILandingHeroProps {
  isAuthenticated: boolean
  isSigningIn: boolean
  authErrorMessage: string | null
  onSignIn: () => void
  onExploreTools: () => void
}

export function LandingHero({
  isAuthenticated,
  isSigningIn,
  authErrorMessage,
  onSignIn,
  onExploreTools,
}: ILandingHeroProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto grid min-h-[640px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            {t('landing.badge')}
          </div>
          <h1 className="font-display text-5xl font-extrabold leading-[1.03] text-foreground sm:text-7xl">
            {t('landing.tagline')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            {t('landing.sub')}
          </p>
          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {isAuthenticated ? (
              <Button
                size="lg"
                className="shadow-lg shadow-primary/20"
                onClick={onExploreTools}
              >
                <LayoutDashboard className="size-5" />
                {t('auth.goToTools')}
                <ArrowRight className="rtl:rotate-180" />
              </Button>
            ) : (
              <ContinueWithGoogleButton
                label={t('auth.continue')}
                connectingLabel={t('auth.connecting')}
                isSigningIn={isSigningIn}
                onSignIn={onSignIn}
              />
            )}
            {authErrorMessage && !isAuthenticated ? (
              <p role="alert" className="max-w-xs text-xs font-medium leading-5 text-destructive">
                {authErrorMessage}
              </p>
            ) : (
              <span className="max-w-xs text-xs leading-5 text-muted-foreground">
                <ShieldCheck className="me-1 inline size-4 text-success" />
                {t('landing.privacy')}
              </span>
            )}
          </div>
        </div>
        <LandingHeroPreview />
      </div>
    </section>
  )
}

function LandingHeroPreview(): JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="relative min-h-[430px]">
      <div className="absolute inset-x-0 top-6 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 font-semibold">
            <Copy className="size-4 text-primary" />
            {t('landing.preview.title')}
          </div>
          <span className="rounded-full bg-success-soft px-2 py-1 text-xs font-semibold text-success">
            {t('landing.preview.ready')}
          </span>
        </div>
        <div className="grid gap-0 md:grid-cols-2">
          <div className="border-e border-border p-4">
            <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">
              {t('landing.preview.source')}
            </p>
            {PREVIEW_VIDEOS.slice(0, 3).map((video) => (
              <MiniVideo key={video.id} video={video} />
            ))}
          </div>
          <div className="bg-muted/40 p-4">
            <p className="mb-3 text-xs font-bold uppercase text-muted-foreground">
              {t('landing.preview.destination')}
            </p>
            {PREVIEW_VIDEOS.slice(1, 4).map((video) => (
              <MiniVideo key={video.id} video={video} />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3">
          <span className="text-sm">
            <b>{PREVIEW_READY_CHANGES}</b> {t('landing.preview.changes')}
          </span>
          <Button size="sm">{t('landing.preview.save')}</Button>
        </div>
      </div>
    </div>
  )
}
