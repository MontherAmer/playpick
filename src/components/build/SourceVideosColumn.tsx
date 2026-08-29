import { ListVideo, Plus, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/Button'
import { VideoCard } from '@/components/videos/VideoCard'
import type { IPlaylistItemsState } from '@/features/playlists/usePlaylistItems'
import type { IPlaylist } from '@/models/playlist'
import type { IPlaylistItem } from '@/models/playlistItem'

interface SourceVideosColumnProps {
  playlist: IPlaylist | undefined
  state: IPlaylistItemsState
  /** Whether this video is already somewhere in the draft. */
  isInDraft: (videoId: string) => boolean
  onAdd: (item: IPlaylistItem) => void
  onAddMany: (items: readonly IPlaylistItem[]) => void
}

/**
 * The chosen playlist's videos, and the two ways to take them.
 *
 * Selection is deliberately **per source**: it is presentation, local to this
 * column, and clearing it on switching away is right because the checkboxes
 * describe *this* playlist. The draft is what must survive the switch, and it
 * lives elsewhere.
 *
 * A video already in the draft is **badged but still addable**. That is the
 * deliberate departure from the approved design, which disables its add control
 * for good: doing that would make an intentional second copy impossible, and
 * wanting a video twice is a legitimate thing to want. The badge informs; it
 * does not forbid.
 */
export function SourceVideosColumn({ playlist, state, isInDraft, onAdd, onAddMany }: SourceVideosColumnProps) {
  const { t } = useTranslation()

  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())

  // Reset during render rather than in an effect, so a new playlist never
  // paints once carrying the previous one's selection.
  const [renderedFor, setRenderedFor] = useState(playlist?.id)

  if (renderedFor !== playlist?.id) {
    setRenderedFor(playlist?.id)
    setQuery('')
    setSelectedIds(new Set())
  }

  // Local to the retrieved list. Typing never reaches the network.
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()

    if (needle === '') return state.items

    return state.items.filter((item) => item.title.toLocaleLowerCase().includes(needle))
  }, [state.items, query])

  /** Unavailable videos are excluded everywhere: adding one would fail at save time. */
  const selectable = useMemo(() => visible.filter((item) => !item.isUnavailable), [visible])

  const selected = useMemo(() => state.items.filter((item) => selectedIds.has(item.id)), [state.items, selectedIds])

  const toggle = (item: IPlaylistItem) => {
    setSelectedIds((current) => {
      const next = new Set(current)

      if (next.has(item.id)) next.delete(item.id)
      else next.add(item.id)

      return next
    })
  }

  const allVisibleSelected = selectable.length > 0 && selectable.every((item) => selectedIds.has(item.id))

  return (
    <section
      aria-label={t('build.videos')}
      className="flex min-h-[22rem] min-w-0 flex-col rounded-xl border bg-card p-3 shadow-card sm:p-4">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">{t('build.videos')}</h2>

      {playlist === undefined ? (
        <EmptyState icon={ListVideo} title={t('build.selectPlaylistHint')} className="flex-1" />
      ) : state.status === 'failed' && state.error !== null ? (
        // A failed *retrieval*, so the shared wording is correct here — unlike a
        // failed write, which needs its own.
        <ErrorState code={state.error} onRetry={state.reload} />
      ) : (
        <>
          <SearchInput
            value={query}
            onChange={setQuery}
            label={t('build.searchLabel')}
            placeholder={t('build.searchVideos')}
            clearLabel={t('build.clearSearch')}
            className="mb-3"
          />

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              disabled={selectable.length === 0}
              onClick={() => {
                setSelectedIds(allVisibleSelected ? new Set() : new Set(selectable.map((item) => item.id)))
              }}>
              {allVisibleSelected ? t('build.deselectAll') : t('build.selectAll')}
            </Button>

            <span aria-live="polite" className="text-sm text-muted-foreground">
              {t('build.selectedCount', { count: selectedIds.size })}
            </span>

            {/* The complete non-drag path to adding, and the only practical one
                for a long playlist. */}
            <Button
              variant="brand"
              className="ms-auto"
              disabled={selected.length === 0}
              onClick={() => {
                onAddMany(selected)
                setSelectedIds(new Set())
              }}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('build.addSelected')}
            </Button>
          </div>

          {state.status === 'loading' && (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('common.loading')}</p>
          )}

          {state.status === 'ready' && state.items.length === 0 && (
            <EmptyState icon={ListVideo} title={t('build.playlistEmpty')} className="flex-1" />
          )}

          {state.status === 'ready' && state.items.length > 0 && visible.length === 0 && (
            <EmptyState icon={SearchX} title={t('build.noMatches')} className="flex-1" />
          )}

          {visible.length > 0 && (
            <ul className="min-h-0 flex-1 list-none space-y-2 overflow-y-auto p-0">
              {visible.map((item) => (
                <li key={item.id}>
                  <VideoCard
                    item={item}
                    leading={
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        disabled={item.isUnavailable}
                        aria-label={t('build.selectVideo', { title: item.title })}
                        onChange={() => {
                          toggle(item)
                        }}
                        className="h-4 w-4 shrink-0 rounded border-input accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40"
                      />
                    }
                    badge={
                      item.isUnavailable ? (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {t('build.unavailable')}
                        </span>
                      ) : isInDraft(item.videoId) ? (
                        // Informs, never forbids: a second copy is legitimate.
                        <span className="rounded-md bg-brand-muted px-2 py-0.5 text-xs font-medium text-brand">
                          {t('build.inDraft')}
                        </span>
                      ) : undefined
                    }
                    actions={
                      <Button
                        variant="outline"
                        disabled={item.isUnavailable}
                        onClick={() => {
                          onAdd(item)
                        }}>
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        {t('build.add')}
                      </Button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
