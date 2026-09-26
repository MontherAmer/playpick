import type { CSSProperties, JSX } from 'react'

import { useTranslation } from 'react-i18next'

import type { IInsightsChannel } from '@/models/insights.interface'

interface IInsightsChannelListProps {
  channels: readonly IInsightsChannel[]
}

export function InsightsChannelList({
  channels,
}: IInsightsChannelListProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const numberFormat = new Intl.NumberFormat(i18n.language)

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="font-display font-extrabold">{t('insights.channels.title')}</h2>
      {channels.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">{t('insights.channels.empty')}</p>
      ) : (
        <div className="mt-5 space-y-4">
          {channels.map((channel) => (
            <div key={channel.name}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="min-w-0 truncate">{channel.name}</span>
                <b>{numberFormat.format(channel.count)}</b>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${channel.widthPercent}%` } satisfies CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
