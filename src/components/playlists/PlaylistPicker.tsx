import { Check, ListVideo, Loader2, RefreshCw, RotateCcw, SearchX } from 'lucide-react'
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

/** A single column of slim rows, for a narrow track where a card's thumbnail will not fit. */
const LIST_CLASSES = 'flex flex-col gap-1'

/** Enough to fill the widest row and imply the next, without pretending to know the library size. */
const SKELETON_COUNT = 6

/**
 * One playlist as a slim row, for `layout="list"`.
 *
 * Kept here rather than added to `PlaylistCard` so this change touches one file.
 * It keeps every accessibility property the card documents: the whole row is a
 * single `<button>`, so one tab stop and one focus ring; the count sits inside
 * it so it stays part of the accessible name and two playlists sharing a title
 * remain distinguishable; and selection is a check mark **as well as** colour.
 */
function PlaylistRow({
  playlist,
  selected,
  onSelect,
}: {
  playlist: IPlaylist
  selected: boolean
  onSelect: (playlist: IPlaylist) => void
}) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => {
        onSelect(playlist)
      }}
      className={cn(
        'flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-start transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        selected ? 'bg-brand-muted text-brand' : 'hover:bg-accent',
      )}>
      <span className="min-w-0 flex-1">
        <span dir="auto" className="block truncate text-sm font-medium">
          {playlist.title === '' ? t('playlist.untitled') : playlist.title}
        </span>

        <span className="block text-xs text-muted-foreground">
          {t('playlist.videoCount', { count: playlist.itemCount })}
        </span>
      </span>

      {selected && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
          <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
          <span className="sr-only">{t('playlist.selected')}</span>
        </span>
      )}
    </button>
  )
}

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
  /**
   * A playlist to leave out of the list entirely.
   *
   * Removed rather than disabled, so a choice that is not allowed simply
   * cannot be made — nothing has to be explained afterwards. Used by Copy
   * Between Playlists to keep the source out of the destination chooser.
   */
  excludeId?: string
  onSelect: (playlist: IPlaylist) => void
  /** Accessible name for the region. Defaults to a generic translated label. */
  label?: string
  /**
   * Selected ids, for choosing **several** playlists rather than one.
   *
   * When present the picker is in multi-select: `selected` comes from set
   * membership rather than id equality, `onSelect` becomes a toggle, and
   * `selectedId` is ignored. Absent, everything behaves exactly as it always
   * has.
   *
   * `PlaylistCard` needs no change to serve this — it is already a toggle,
   * rendering `aria-pressed` with a ring **and** a check mark, and a set of
   * `aria-pressed` buttons is correct ARIA for multi-select.
   */
  selectedIds?: ReadonlySet<string>
  /**
   * How the playlists are presented.
   *
   * `'grid'` — the default, and exactly what every existing caller gets.
   * `'list'` — slim rows for a narrow column, where a card's thumbnail does not
   * fit. Everything else is shared: one library read, one search, one
   * pagination, one set of empty and error states.
   */
  layout?: 'grid' | 'list'
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
export function PlaylistPicker({
  selectedId,
  selectedIds,
  excludeId,
  onSelect,
  label,
  layout = 'grid',
  className,
}: PlaylistPickerProps) {
  const { t } = useTranslation()
  const { playlists, status, error, hasMore, totalResults, isLoadingMore, loadMoreError, loadMore, refresh } =
    usePlaylistLibrary()
  const [query, setQuery] = useState('')

  const isLoadingFirstPage = status === 'idle' || status === 'loading'
  const isReady = status === 'ready'

  /**
   * Excluded before anything else, so it is invisible to the filter, to the
   * counts, and to the empty states alike. Excluding the only playlist in the
   * library must read as "nothing to choose", never as "your search matched
   * nothing".
   */
  const selectablePlaylists = useMemo(
    () => (excludeId === undefined ? playlists : playlists.filter((playlist) => playlist.id !== excludeId)),
    [playlists, excludeId],
  )

  // Synchronous and local — typing never reaches the network, because
  // playlists.list cannot search by title at all (research R2, FR-016).
  const visiblePlaylists = useMemo(
    () => filterPlaylistsByTitle(selectablePlaylists, query),
    [selectablePlaylists, query],
  )

  const hasNoMatches = isReady && selectablePlaylists.length > 0 && visiblePlaylists.length === 0

  const isSelected = (playlist: IPlaylist) =>
    selectedIds === undefined ? playlist.id === selectedId : selectedIds.has(playlist.id)

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
          {isReady && selectablePlaylists.length > 0 && (
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

          {layout === 'grid' ? (
            <div className={GRID_CLASSES} aria-hidden="true">
              {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <PlaylistCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className={LIST_CLASSES} aria-hidden="true">
              {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <div key={index} className="h-11 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          )}
        </>
      )}

      {status === 'error' && error !== null && <ErrorState code={error} onRetry={refresh} />}

      {isReady && selectablePlaylists.length === 0 && (
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
        <ul className={cn(layout === 'grid' ? GRID_CLASSES : LIST_CLASSES, 'list-none p-0')}>
          {visiblePlaylists.map((playlist) => (
            <li key={playlist.id}>
              {layout === 'grid' ? (
                <PlaylistCard playlist={playlist} selected={isSelected(playlist)} onSelect={onSelect} />
              ) : (
                <PlaylistRow playlist={playlist} selected={isSelected(playlist)} onSelect={onSelect} />
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Deliberately outside the grid branch, so it stays reachable when the
          filter matches nothing — the next page is exactly where the missing
          playlist may be. */}
      {isReady && hasMore && (
        <div className="flex flex-col items-center gap-2 pt-1">
          {loadMoreError !== null && (
            <p role="alert" className="flex flex-wrap items-center justify-center gap-2 text-sm text-destructive">
              <span>
                {t('playlist.loadMoreFailed')} {t(`errors.youtube.${loadMoreError}`)}
              </span>

              <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {t('common.retry')}
              </Button>
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={loadMore} disabled={isLoadingMore}>
              {isLoadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {t('playlist.loadMore')}
            </Button>

            <p className="text-sm text-muted-foreground">
              {t('playlist.showingCount', { shown: visiblePlaylists.length, total: totalResults })}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
