import { EyeOff, ExternalLink, Play } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import type { IPlaylistItem } from '@/models/playlistItem'
import { cn } from '@/utils/cn'

interface VideoCardProps {
  item: IPlaylistItem
  /**
   * One-based, for display. The model holds no position — order is the array
   * index.
   *
   * Optional because a running-order number means nothing in a copy list, where
   * showing one would imply an ordering the person did not choose.
   */
  position?: number
  /** The drag affordance, supplied by `SortableVideoCard`. */
  dragHandle?: ReactNode
  /** Before the position: a selection checkbox in a copy source panel. */
  leading?: ReactNode
  /** Status marking — "will be added", "already in this playlist". */
  badge?: ReactNode
  /** Move controls, supplied by `SortableVideoCard`. */
  actions?: ReactNode
  className?: string
}

/** `1:03`, `12:34`, `1:02:03` — hours only when there are any. */
function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const paddedSeconds = String(seconds).padStart(2, '0')

  if (hours > 0) return `${String(hours)}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`

  return `${String(minutes)}:${paddedSeconds}`
}

function videoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

/**
 * One video in the running order.
 *
 * Purely presentational: it knows nothing about dragging or about the draft.
 * `SortableVideoCard` supplies both, so this component stays usable anywhere a
 * video needs displaying.
 */
export function VideoCard({ item, position, dragHandle, leading, badge, actions, className }: VideoCardProps) {
  const { t } = useTranslation()

  const title = item.title === '' ? t('playlist.untitledVideo') : item.title
  // A zero-length duration is real for a live stream but would render "0:00",
  // which says something false about the video. No badge is the honest answer.
  const duration = item.durationSeconds !== undefined && item.durationSeconds > 0 ? item.durationSeconds : undefined

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border bg-card p-2 shadow-card transition-colors sm:gap-3',
        className,
      )}>
      {dragHandle}

      {leading}

      {position !== undefined && (
        <span className="w-7 shrink-0 text-center text-sm font-semibold text-muted-foreground tabular-nums">
          {String(position).padStart(2, '0')}
        </span>
      )}

      <div className="relative w-24 shrink-0 sm:w-32">
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <Play className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </span>
          )}
        </div>

        {duration !== undefined && (
          <span className="absolute end-1 bottom-1 rounded bg-black/75 px-1 py-0.5 text-[11px] font-medium text-white tabular-nums">
            {formatDuration(duration)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {/* `dir="auto"` so a title in the other script is not laid out backwards. */}
        <p dir="auto" className="truncate text-sm leading-snug font-medium">
          {title}
        </p>

        {item.channelTitle !== undefined && (
          <p dir="auto" className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.channelTitle}
          </p>
        )}

        {badge}

        {item.isUnavailable && (
          // Icon *and* text: unavailability must never be carried by colour alone.
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <EyeOff className="h-3 w-3" aria-hidden="true" />
            {t('playlist.unavailableVideo')}
          </p>
        )}
      </div>

      <a
        href={videoUrl(item.videoId)}
        target="_blank"
        rel="noreferrer"
        aria-label={t('common.openOnYouTube')}
        className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>

      {actions}
    </div>
  )
}
