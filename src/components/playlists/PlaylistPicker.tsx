import { ListVideo, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PlaylistCard } from '@/components/playlists/PlaylistCard'
import { Button } from '@/components/ui/Button'
import { usePlaylistLibrary } from '@/features/playlists/usePlaylistLibrary'
import type { IPlaylist } from '@/models/playlist'
import { cn } from '@/utils/cn'

/** One layout at every breakpoint — the reference design's toggle is deliberately not carried over. */
const GRID_CLASSES = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'

/** Enough to fill the widest row and imply the next, without pretending to know the library size. */
const SKELETON_COUNT = 6

/** A card's silhouette, so the grid does not reflow when the real cards arrive. */
function PlaylistCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-card">
      <div className="aspect-video w-full animate-pulse bg-muted" />

      <div className="flex flex-col gap-2 p-3">
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

interface PlaylistPickerProps {
  /** Controlled: the picker renders the selection, it never owns it. */
  selectedId?: string
  onSelect: (playlist: IPlaylist) => void
  /** Accessible name for the region. Defaults to a generic translated label. */
  label?: string
  className?: string
}

/**
 * The selection surface: the connected user's playlists, one of which can be
 * chosen.
 *
 * Controlled by contract. Holding no selection state is what lets a future
 * two-sided tool drive two pickers from two independent `usePlaylistSelection()`
 * instances over a single shared library.
 *
 * Reads the library rather than fetching: mounting a second picker, or the same
 * one a second time in a session, costs no request (FR-008).
 */
export function PlaylistPicker({ selectedId, onSelect, label, className }: PlaylistPickerProps) {
  const { t } = useTranslation()
  const { playlists, status, error, refresh } = usePlaylistLibrary()

  const isLoadingFirstPage = status === 'idle' || status === 'loading'

  return (
    <section
      aria-label={label ?? t('playlist.regionLabel')}
      aria-busy={isLoadingFirstPage}
      className={cn('flex flex-col gap-3', className)}>
      {/* Suppressed while the error state is showing: its retry does the same
          job, and two adjacent controls for one action only reads as confusing. */}
      {status !== 'error' && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" onClick={refresh} disabled={isLoadingFirstPage}>
            <RefreshCw className={cn('h-4 w-4', isLoadingFirstPage && 'animate-spin')} aria-hidden="true" />
            {t('playlist.refresh')}
          </Button>
        </div>
      )}

      {isLoadingFirstPage && (
        <>
          <span className="sr-only">{t('common.loading')}</span>

          <div className={GRID_CLASSES} aria-hidden="true">
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <PlaylistCardSkeleton key={index} />
            ))}
          </div>
        </>
      )}

      {status === 'error' && error !== null && <ErrorState code={error} onRetry={refresh} />}

      {status === 'ready' && playlists.length === 0 && (
        <EmptyState icon={ListVideo} title={t('playlist.empty.title')} description={t('playlist.empty.description')} />
      )}

      {status === 'ready' && playlists.length > 0 && (
        <ul className={cn(GRID_CLASSES, 'list-none p-0')}>
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <PlaylistCard playlist={playlist} selected={playlist.id === selectedId} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
