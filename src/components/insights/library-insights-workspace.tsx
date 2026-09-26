import type { JSX } from 'react'

import { RefreshCw, ShieldAlert, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ContinueWithGoogleButton } from '@/components/auth/continue-with-google-button'
import { Button } from '@/components/ui/button'
import { useLibraryInsights } from '@/features/insights/use-library-insights'

import { InsightsChannelList } from './insights-channel-list'
import { InsightsDurationChart } from './insights-duration-chart'
import { InsightsPlaylistList } from './insights-playlist-list'
import { InsightsStatGrid } from './insights-stat-grid'
import { InsightsYearChart } from './insights-year-chart'

export function LibraryInsightsWorkspace(): JSX.Element {
  const { t } = useTranslation()
  const insights = useLibraryInsights()

  if (!insights.auth.isAuthenticated) {
    return (
      <section className="mx-auto max-w-lg rounded-lg border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-primary" />
        <h2 className="mt-4 font-display text-xl font-extrabold">
          {t('insights.connect.title')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('insights.connect.description')}
        </p>
        <ContinueWithGoogleButton
          label={t('auth.continue')}
          connectingLabel={t('auth.connecting')}
          isSigningIn={insights.auth.status === 'signingIn'}
          onSignIn={() => void insights.auth.signIn()}
          className="mx-auto mt-6"
        />
      </section>
    )
  }

  if (insights.loadState.status === 'loading' || insights.loadState.status === 'idle') {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <RefreshCw className="mx-auto size-10 animate-spin text-primary" />
        <h2 className="mt-5 font-display text-xl font-extrabold">
          {t('insights.scan.title')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {insights.progress
            ? t(`insights.scan.${insights.progress.phase}`, {
                completed: insights.progress.completed,
                total: insights.progress.total,
              })
            : t('insights.scan.description')}
        </p>
      </div>
    )
  }

  if (insights.loadState.status === 'failed' || !insights.report) {
    return (
      <section className="rounded-lg border border-border bg-card p-8 text-center">
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.youtube.${insights.loadState.error ?? 'unknown'}`)}
        </p>
        <Button className="mt-4" variant="outline" onClick={insights.retry}>
          {t('insights.retry')}
        </Button>
      </section>
    )
  }

  const report = insights.report

  if (report.playlistCount === 0) {
    return (
      <section className="rounded-lg border border-border bg-card p-10 text-center">
        <h2 className="font-display text-xl font-extrabold">{t('insights.empty.title')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('insights.empty.description')}
        </p>
      </section>
    )
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <Button variant="outline" onClick={insights.retry}>
          <RefreshCw />
          {t('insights.scanAgain')}
        </Button>
      </div>

      {report.failedPlaylistCount > 0 ? (
        <p className="mb-5 flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {t('insights.partialFailure', { count: report.failedPlaylistCount })}
        </p>
      ) : null}

      <InsightsStatGrid report={report} />

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <InsightsYearChart years={report.years} />
        <InsightsChannelList channels={report.channels} />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <InsightsPlaylistList playlists={report.largestPlaylists} />
        <InsightsDurationChart buckets={report.durationBuckets} />
      </div>
    </>
  )
}
