import type { JSX } from 'react'

import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { INSIGHTS_STAT_KEYS } from '@/features/insights/insights.constants'
import { formatCompactDuration } from '@/features/insights/insights.utils'
import { cn } from '@/lib/cn'
import type { IInsightsReport } from '@/models/insights.interface'
import { ROUTES } from '@/routes'

interface IInsightsStatGridProps {
  report: IInsightsReport
}

export function InsightsStatGrid({ report }: IInsightsStatGridProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const numberFormat = new Intl.NumberFormat(i18n.language)
  const duration = formatCompactDuration(report.durationSeconds)
  const values: Record<(typeof INSIGHTS_STAT_KEYS)[number], string> = {
    playlists: numberFormat.format(report.playlistCount),
    videoEntries: numberFormat.format(report.videoEntries),
    uniqueVideos: numberFormat.format(report.uniqueVideos),
    duplicates: numberFormat.format(report.duplicates),
    duration:
      duration.hours > 0
        ? t('insights.duration.hoursMinutes', duration)
        : t('insights.duration.minutes', { minutes: duration.minutes }),
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {INSIGHTS_STAT_KEYS.map((statKey) => (
        <div
          key={statKey}
          className={cn(
            'rounded-lg border p-4',
            statKey === 'duration'
              ? 'col-span-2 border-primary bg-primary-soft lg:col-span-1'
              : 'border-border bg-card',
          )}
        >
          <span className="text-xs text-muted-foreground">
            {t(`insights.stats.${statKey}`)}
          </span>
          <b className="mt-2 block text-2xl">{values[statKey]}</b>
          {statKey === 'duplicates' && report.duplicates > 0 ? (
            <Link
              to={ROUTES.tools.cleaner}
              className="mt-2 inline-block text-xs font-bold text-primary"
            >
              {t('insights.cleanDuplicates')}
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  )
}
