import type { JSX } from 'react'

import { Image } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { IInsightsPlaylistRow } from '@/models/insights.interface'

interface IInsightsPlaylistListProps {
  playlists: readonly IInsightsPlaylistRow[]
}

export function InsightsPlaylistList({
  playlists,
}: IInsightsPlaylistListProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const numberFormat = new Intl.NumberFormat(i18n.language)

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="font-display font-extrabold">{t('insights.playlists.title')}</h2>
      {playlists.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">{t('insights.playlists.empty')}</p>
      ) : (
        playlists.map((playlist, index) => (
          <div key={playlist.id} className="mt-4 flex items-center gap-3">
            <span className="w-6 text-sm font-bold text-muted-foreground">
              {String(index + 1).padStart(2, '0')}
            </span>
            {playlist.thumbnailUrl ? (
              <img
                src={playlist.thumbnailUrl}
                alt=""
                className="h-10 w-16 shrink-0 rounded object-cover"
              />
            ) : (
              <span className="grid h-10 w-16 shrink-0 place-items-center rounded bg-muted">
                <Image className="size-4 text-muted-foreground" />
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {playlist.title || t('copy.untitled')}
            </span>
            <b className="text-sm">{numberFormat.format(playlist.itemCount)}</b>
          </div>
        ))
      )}
    </section>
  )
}
