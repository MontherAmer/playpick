import type { JSX } from 'react'

import { Image } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/cn'
import type { ComparePresence, ICompareRow } from '@/models/compare.interface'

interface ICompareVideoListProps {
  rows: readonly ICompareRow[]
  selectedVideoIds: ReadonlySet<string>
  emptyMessage: string
  onToggle: (videoId: string) => void
}

const PRESENCE_BADGE_CLASSES: Record<ComparePresence, string> = {
  onlyA: 'bg-primary-soft text-primary',
  both: 'bg-success-soft text-success',
  onlyB: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
}

export function CompareVideoList({
  rows,
  selectedVideoIds,
  emptyMessage,
  onToggle,
}: ICompareVideoListProps): JSX.Element {
  const { t } = useTranslation()

  if (rows.length === 0) {
    return <p className="p-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className="divide-y divide-border">
      {rows.map((row) => (
        <div
          key={`${row.presence}-${row.video.id}`}
          className={cn(
            'flex items-center gap-3 p-3',
            row.video.isUnavailable && 'opacity-50',
          )}
        >
          <input
            type="checkbox"
            checked={selectedVideoIds.has(row.video.videoId)}
            disabled={row.video.isUnavailable}
            onChange={() => onToggle(row.video.videoId)}
            aria-label={t('compare.selectVideo', { title: row.video.title })}
            className="size-4 accent-primary"
          />
          {row.video.thumbnailUrl ? (
            <img
              src={row.video.thumbnailUrl}
              alt=""
              className="h-12 w-20 shrink-0 rounded object-cover"
            />
          ) : (
            <span className="grid h-12 w-20 shrink-0 place-items-center rounded bg-muted">
              <Image className="size-4 text-muted-foreground" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <b className="line-clamp-2 block text-sm">
              {row.video.title || t('copy.untitled')}
            </b>
            <small className="block truncate text-muted-foreground">
              {row.video.channelTitle}
            </small>
          </span>
          <span
            className={cn(
              'hidden rounded-full px-2 py-1 text-[10px] font-bold sm:inline',
              row.video.isUnavailable
                ? 'bg-muted text-muted-foreground'
                : PRESENCE_BADGE_CLASSES[row.presence],
            )}
          >
            {t(
              row.video.isUnavailable
                ? 'compare.status.unavailable'
                : `compare.status.${row.presence}`,
            )}
          </span>
        </div>
      ))}
    </div>
  )
}
