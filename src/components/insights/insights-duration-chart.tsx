import type { CSSProperties, JSX } from 'react'

import { useTranslation } from 'react-i18next'

import type { IInsightsDurationBucket } from '@/models/insights.interface'

interface IInsightsDurationChartProps {
  buckets: readonly IInsightsDurationBucket[]
}

export function InsightsDurationChart({
  buckets,
}: IInsightsDurationChartProps): JSX.Element {
  const { t } = useTranslation()
  const hasData = buckets.some((bucket) => bucket.count > 0)

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="font-display font-extrabold">{t('insights.buckets.title')}</h2>
      {hasData ? (
        <div className="mt-8 flex h-36 items-end justify-around gap-4">
          {buckets.map((bucket) => (
            <div
              key={bucket.id}
              className="flex h-full flex-1 flex-col justify-end text-center"
            >
              <div
                className="rounded-t bg-primary/70"
                style={{ height: `${bucket.heightPercent}%` } satisfies CSSProperties}
                title={t('insights.buckets.barLabel', {
                  label: t(`insights.buckets.${bucket.id}`),
                  count: bucket.count,
                })}
              />
              <span className="mt-2 text-[10px] text-muted-foreground">
                {t(`insights.buckets.${bucket.id}`)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">{t('insights.buckets.empty')}</p>
      )}
    </section>
  )
}
