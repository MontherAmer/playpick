import type { CSSProperties, JSX } from 'react'

import { BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { IInsightsYearBar } from '@/models/insights.interface'

interface IInsightsYearChartProps {
  years: readonly IInsightsYearBar[]
}

export function InsightsYearChart({ years }: IInsightsYearChartProps): JSX.Element {
  const { t } = useTranslation()
  const hasData = years.some((bar) => bar.count > 0)

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex justify-between">
        <div>
          <h2 className="font-display font-extrabold">{t('insights.years.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('insights.years.description')}</p>
        </div>
        <BarChart3 className="size-5 text-primary" />
      </div>
      {hasData ? (
        <div className="mt-8 flex h-56 items-end gap-4 border-b border-border">
          {years.map((bar) => (
            <div key={bar.year} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t bg-primary"
                style={{ height: `${bar.heightPercent}%` } satisfies CSSProperties}
                title={t('insights.years.barLabel', {
                  year: bar.year,
                  count: bar.count,
                })}
              />
              <span className="text-[10px] text-muted-foreground">{bar.year}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">{t('insights.years.empty')}</p>
      )}
    </section>
  )
}
