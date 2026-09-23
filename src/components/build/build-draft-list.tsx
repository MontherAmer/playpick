import type { JSX } from 'react'

import { ArrowDown, ArrowUp, Image, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import type { IBuildEntry } from '@/models/build.interface'

interface IBuildDraftListProps {
  entries: readonly IBuildEntry[]
  onMove: (fromIndex: number, toIndex: number) => void
  onRemove: (key: string) => void
}

export function BuildDraftList({
  entries,
  onMove,
  onRemove,
}: IBuildDraftListProps): JSX.Element {
  const { t } = useTranslation()

  if (entries.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        {t('build.draft.empty')}
      </p>
    )
  }

  return (
    <div className="divide-y divide-border">
      {entries.map((entry, index) => (
        <div
          key={entry.key}
          className={cn('flex items-center gap-2 p-3', entry.isDuplicate && 'bg-amber-500/5')}
        >
          <span className="w-6 shrink-0 text-center text-xs font-bold text-muted-foreground">
            {index + 1}
          </span>
          {entry.video.thumbnailUrl ? (
            <img
              src={entry.video.thumbnailUrl}
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
              {entry.video.title || t('copy.untitled')}
            </b>
            <small className="block truncate text-muted-foreground">
              {entry.video.channelTitle}
            </small>
          </span>
          {entry.isDuplicate ? (
            <span className="hidden rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-700 sm:inline dark:text-amber-300">
              {t('build.draft.duplicate')}
            </span>
          ) : null}
          <div className="flex">
            <Button
              variant="ghost"
              size="icon"
              disabled={index === 0}
              onClick={() => onMove(index, index - 1)}
              aria-label={t('build.draft.moveUp')}
            >
              <ArrowUp />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={index === entries.length - 1}
              onClick={() => onMove(index, index + 1)}
              aria-label={t('build.draft.moveDown')}
            >
              <ArrowDown />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(entry.key)}
              aria-label={t('build.draft.remove')}
            >
              <X />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
