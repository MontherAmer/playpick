import { ChevronsUpDown, ListVideo, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/Button'
import type { IPlaylistItemsState } from '@/features/playlists/usePlaylistItems'
import type { IPlaylist } from '@/models/playlist'
import { cn } from '@/utils/cn'

interface PlaylistPanelProps {
  role: 'source' | 'destination'
  playlist: IPlaylist | undefined
  onChoose: () => void
  state: IPlaylistItemsState
  /** Shown above the list — the source's search and selection toolbar. */
  toolbar?: ReactNode
  /** The rows. Supplied by the page, so the panel knows nothing about copying. */
  children?: ReactNode
  /** Shown below the list — the destination's duplicate notice. */
  footer?: ReactNode
  className?: string
}

/**
 * One side of the copy screen, used twice.
 *
 * Deliberately ignorant of copying: it renders a playlist's contents and the
 * states around retrieving them, and takes the rows as children. That is what
 * lets the same component serve a source panel with checkboxes and drag handles
 * and a destination panel with drop targets and badges.
 *
 * The list gets its **own** scroll container rather than growing the page, so
 * two long playlists sit side by side instead of one pushing the other's
 * controls off screen.
 */
export function PlaylistPanel({
  role,
  playlist,
  onChoose,
  state,
  toolbar,
  children,
  footer,
  className,
}: PlaylistPanelProps) {
  const { t } = useTranslation()

  const roleLabel = role === 'source' ? t('copy.source') : t('copy.destination')
  const choosePrompt = role === 'source' ? t('copy.selectSource') : t('copy.selectDestination')
  const emptyText = role === 'source' ? t('copy.emptySource') : t('copy.emptyDestination')

  return (
    <section
      aria-label={roleLabel}
      className={cn('flex min-h-[22rem] flex-col rounded-xl border bg-card p-4 shadow-card', className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{roleLabel}</p>

          <p dir="auto" className="truncate font-semibold">
            {playlist?.title ?? '—'}
          </p>
        </div>

        <Button variant="ghost" size="icon" onClick={onChoose} aria-label={t('copy.changePlaylist')}>
          <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {toolbar}

      {/* The panel's own scroll region: a long playlist scrolls here rather
          than growing the page and pushing the other panel's controls away. */}
      <div className="mt-3 max-h-[60vh] min-h-0 flex-1 overflow-y-auto pe-1">
        {playlist === undefined && (
          <EmptyState
            icon={ListVideo}
            title={choosePrompt}
            action={<Button onClick={onChoose}>{t('copy.choosePlaylist')}</Button>}
          />
        )}

        {playlist !== undefined && state.status === 'loading' && (
          <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {state.progress
              ? t('reorder.loading', { retrieved: state.progress.retrieved, total: state.progress.total })
              : t('common.loading')}
          </p>
        )}

        {playlist !== undefined && state.status === 'failed' && state.error !== null && (
          <ErrorState code={state.error} onRetry={state.reload} />
        )}

        {playlist !== undefined && state.status === 'ready' && state.items.length === 0 && !children && (
          <EmptyState icon={ListVideo} title={emptyText} />
        )}

        {playlist !== undefined && state.status === 'ready' && children}
      </div>

      {footer && <div className="mt-3">{footer}</div>}
    </section>
  )
}
