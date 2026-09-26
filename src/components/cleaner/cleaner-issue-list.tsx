import type { JSX } from 'react'

import { Image } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { classifyIssue } from '@/features/cleaner/cleaner.utils'
import { cn } from '@/lib/cn'
import type { IVideo } from '@/models/copy.interface'

interface ICleanerIssueListProps {
  videos: readonly IVideo[]
  selectedIssueIds: ReadonlySet<string>
  onToggle: (playlistItemId: string) => void
}

export function CleanerIssueList({
  videos,
  selectedIssueIds,
  onToggle,
}: ICleanerIssueListProps): JSX.Element {
  const { t } = useTranslation()

  if (videos.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">{t('cleaner.issues.empty')}</p>
  }

  return (
    <div className="divide-y divide-border">
      {videos.map((video) => {
        const kind = classifyIssue(video) ?? 'unavailable'

        return (
          <label key={video.id} className="flex cursor-pointer items-center gap-3 p-3">
            <input
              type="checkbox"
              checked={selectedIssueIds.has(video.id)}
              onChange={() => onToggle(video.id)}
              aria-label={t('cleaner.issues.select', { title: video.title })}
              className="size-4 accent-primary"
            />
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
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
                {video.title || t('copy.untitled')}
              </b>
              <small className="block truncate text-muted-foreground">
                {video.channelTitle}
              </small>
            </span>
            <span
              className={cn(
                'hidden rounded-full px-2 py-1 text-[10px] font-bold sm:inline',
                kind === 'unavailable'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {t(`cleaner.issues.kind.${kind}`)}
            </span>
          </label>
        )
      })}
    </div>
  )
}
