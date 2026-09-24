import type { JSX } from 'react'

import { ArrowDown, ArrowUp, Image, LoaderCircle, RotateCcw, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import type { YouTubeErrorCode } from '@/api/youtube/errors'
import type { IPlaylist, IVideo, LoadStatus } from '@/models/copy.interface'

interface ISourceState {
  status: LoadStatus
  error: YouTubeErrorCode | null
  videos: IVideo[]
}

interface IMergeSourceListProps {
  playlists: readonly IPlaylist[]
  states: Readonly<Record<string, ISourceState>>
  onMove: (fromIndex: number, toIndex: number) => void
  onRemove: (playlistId: string) => void
  onRetry: (playlist: IPlaylist) => void
}

export function MergeSourceList({
  playlists,
  states,
  onMove,
  onRemove,
  onRetry,
}: IMergeSourceListProps): JSX.Element {
  const { t } = useTranslation()

  if (playlists.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {t('merge.sources.empty')}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {playlists.map((playlist, index) => {
        const state = states[playlist.id]

        return (
          <div
            key={playlist.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
              {index + 1}
            </span>
            {playlist.thumbnailUrl ? (
              <img
                src={playlist.thumbnailUrl}
                alt=""
                className="h-14 w-24 shrink-0 rounded object-cover"
              />
            ) : (
              <span className="grid h-14 w-24 shrink-0 place-items-center rounded bg-muted">
                <Image className="size-4 text-muted-foreground" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <b className="block truncate text-sm">{playlist.title || t('copy.untitled')}</b>
              <small className="text-muted-foreground">
                {state?.status === 'loading' ? (
                  <span className="inline-flex items-center gap-1">
                    <LoaderCircle className="size-3 animate-spin" />
                    {t('merge.sources.loading')}
                  </span>
                ) : state?.status === 'failed' ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-destructive"
                    onClick={() => onRetry(playlist)}
                  >
                    <RotateCcw className="size-3" />
                    {t(`errors.youtube.${state.error ?? 'unknown'}`)}
                  </button>
                ) : (
                  t('merge.sources.videoCount', {
                    count: state?.videos.length ?? playlist.itemCount,
                  })
                )}
              </small>
            </span>
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                disabled={index === 0}
                onClick={() => onMove(index, index - 1)}
                aria-label={t('merge.sources.moveUp')}
              >
                <ArrowUp />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={index === playlists.length - 1}
                onClick={() => onMove(index, index + 1)}
                aria-label={t('merge.sources.moveDown')}
              >
                <ArrowDown />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(playlist.id)}
                aria-label={t('merge.sources.remove')}
              >
                <X />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
