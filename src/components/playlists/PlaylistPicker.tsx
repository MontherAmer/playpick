import { ListVideo, RefreshCw, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { SearchInput } from '@/components/common/SearchInput'
import { PlaylistCard } from '@/components/playlists/PlaylistCard'
import { Button } from '@/components/ui/Button'
import { filterPlaylistsByTitle } from '@/features/playlists/filterPlaylists'
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
 * one a second time in a session, costs no request (FR-008). The filter is the
 * one piece of state it does own — it is presentation, local to this surface,
 * and two pickers over one library filter independently.
 */
export function PlaylistPicker({ selectedId, onSelect, label, className }: PlaylistPickerProps) {
  const { t } = useTranslation()
  const { playlists, status, error, hasMore, refresh } = usePlaylistLibrary()
  const [query, setQuery] = useState('')

  const isLoadingFirstPage = status === 'idle' || status === 'loading'
  const isReady = status === 'ready'

  // Synchronous and local — typing never reaches the network, because
  // playlists.list cannot search by title at all (research R2, FR-016).
  const visiblePlaylists = useMemo(() => filterPlaylistsByTitle(playlists, query), [playlists, query])

  const hasNoMatches = isReady && playlists.length > 0 && visiblePlaylists.length === 0

  /**
   * With pages still unretrieved, "no matches" is only true of what has loaded.
   * Saying so is the difference between an actionable state and a quietly wrong
   * one — the user's playlist may simply be in a page they have not asked for
   * yet (research R3).
   */
  const noMatchesDescription = hasMore
    ? `${t('playlist.noMatches.description')} ${t('playlist.noMatches.partial')}`
    : t('playlist.noMatches.description')

  return (
    <section
      aria-label={label ?? t('playlist.regionLabel')}
      aria-busy={isLoadingFirstPage}
      className={cn('flex flex-col gap-3', className)}>
      {/* Suppressed while the error state is showing: its retry does the same
          job, and two adjacent controls for one action only reads as confusing. */}
      {status !== 'error' && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isReady && playlists.length > 0 && (
            <SearchInput
              value={query}
              onChange={setQuery}
              label={t('playlist.searchLabel')}
              placeholder={t('playlist.searchPlaceholder')}
              clearLabel={t('playlist.clearSearch')}
              className="min-w-[180px] flex-1"
            />
          )}

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

      {isReady && playlists.length === 0 && (
        <EmptyState icon={ListVideo} title={t('playlist.empty.title')} description={t('playlist.empty.description')} />
      )}

      {/* Distinct from the empty library above by icon and by wording: one says
          "narrow your search", the other "there is nothing to search". */}
      {hasNoMatches && (
        <EmptyState icon={SearchX} title={t('playlist.noMatches.title')} description={noMatchesDescription} />
      )}

      {/* Gated on `isReady` as well as the count: during a refresh the previous
          playlists are still in state, and rendering them beside the skeletons
          would show the list twice. */}
      {isReady && visiblePlaylists.length > 0 && (
        <ul className={cn(GRID_CLASSES, 'list-none p-0')}>
          {visiblePlaylists.map((playlist) => (
            <li key={playlist.id}>
              <PlaylistCard playlist={playlist} selected={playlist.id === selectedId} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
