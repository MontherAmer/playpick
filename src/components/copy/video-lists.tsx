import type { DragEvent, JSX } from 'react'

import { GripVertical, Image, Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import type { IPendingCopy, IVideo } from '@/models/copy.interface'

interface ISourceVideoListProps {
  videos: readonly IVideo[]
  selectedVideoIds: ReadonlySet<string>
  disabled: boolean
  onToggle: (videoId: string) => void
  onAdd: (video: IVideo) => void
}

function VideoThumbnail({ video }: { video: IVideo }): JSX.Element {
  return video.thumbnailUrl ? (
    <img
      src={video.thumbnailUrl}
      alt=""
      className="h-12 w-20 shrink-0 rounded object-cover"
    />
  ) : (
    <span className="grid h-12 w-20 shrink-0 place-items-center rounded bg-muted">
      <Image className="size-4 text-muted-foreground" />
    </span>
  )
}

export function SourceVideoList({
  videos,
  selectedVideoIds,
  disabled,
  onToggle,
  onAdd,
}: ISourceVideoListProps): JSX.Element {
  const { t } = useTranslation()

  if (videos.length === 0) {
    return <p className="p-8 text-center text-sm text-muted-foreground">{t('copy.noVideos')}</p>
  }

  return (
    <div className="divide-y divide-border">
      {videos.map((video) => (
        <div
          key={video.id}
          draggable={!disabled && !video.isUnavailable}
          onDragStart={(event: DragEvent<HTMLDivElement>) => {
            event.dataTransfer.setData('text/plain', video.videoId)
          }}
          className={cn(
            'group flex items-center gap-2 p-3',
            !disabled && !video.isUnavailable && 'cursor-grab',
            video.isUnavailable && 'opacity-50',
          )}
        >
          <GripVertical className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
          <input
            type="checkbox"
            checked={selectedVideoIds.has(video.videoId)}
            disabled={disabled || video.isUnavailable}
            onChange={() => onToggle(video.videoId)}
            aria-label={t('copy.selectVideo', { title: video.title })}
            className="size-4 accent-primary"
          />
          <VideoThumbnail video={video} />
          <span className="min-w-0 flex-1">
            <b className="line-clamp-2 block text-sm">{video.title || t('copy.untitled')}</b>
            <small className="block truncate text-muted-foreground">{video.channelTitle}</small>
          </span>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled || video.isUnavailable}
            onClick={() => onAdd(video)}
            aria-label={t('copy.addVideo', { title: video.title })}
          >
            <Plus />
          </Button>
        </div>
      ))}
    </div>
  )
}

interface IDestinationVideoListProps {
  existingVideos: readonly IVideo[]
  pending: readonly IPendingCopy[]
  onRemovePending: (key: string) => void
}

export function DestinationVideoList({
  existingVideos,
  pending,
  onRemovePending,
}: IDestinationVideoListProps): JSX.Element {
  const { t } = useTranslation()
  const rows = [
    ...pending.map((copy) => ({ key: copy.key, video: copy.video, copy })),
    ...existingVideos.map((video) => ({ key: video.id, video, copy: undefined })),
  ]

  if (rows.length === 0) {
    return <p className="p-8 text-center text-sm text-muted-foreground">{t('copy.destinationEmpty')}</p>
  }

  return (
    <div className="divide-y divide-border">
      {rows.map(({ key, video, copy }) => (
        <div
          key={key}
          className={cn('flex items-center gap-3 p-3', copy?.isDuplicate && 'bg-amber-500/5')}
        >
          <VideoThumbnail video={video} />
          <span className="min-w-0 flex-1">
            <b className="line-clamp-2 block text-sm">{video.title || t('copy.untitled')}</b>
            <small className="block truncate text-muted-foreground">{video.channelTitle}</small>
          </span>
          {copy ? (
            <>
              <span
                className={cn(
                  'hidden rounded-full px-2 py-1 text-[10px] font-bold sm:inline',
                  copy.isDuplicate
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : 'bg-success-soft text-success',
                )}
              >
                {t(copy.isDuplicate ? 'copy.status.duplicate' : 'copy.status.new')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemovePending(copy.key)}
                aria-label={t('copy.removePending')}
              >
                <X />
              </Button>
            </>
          ) : (
            <span className="hidden rounded-full bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground sm:inline">
              {t('copy.status.existing')}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
