import { DndContext, PointerSensor, closestCenter, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { CheckSquare, MoveRight, Plus, Square } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PendingChangesBar } from '@/components/common/PendingChangesBar'
import { SearchInput } from '@/components/common/SearchInput'
import { DuplicateNotice } from '@/components/copy/DuplicateNotice'
import { PlaylistPanel } from '@/components/copy/PlaylistPanel'
import { PlaylistPicker } from '@/components/playlists/PlaylistPicker'
import { Button } from '@/components/ui/Button'
import { DestinationVideoCard } from '@/components/videos/DestinationVideoCard'
import { DraggableVideoCard } from '@/components/videos/DraggableVideoCard'
import { useCopyDraft } from '@/features/copy/useCopyDraft'
import { usePlaylistItems } from '@/features/playlists/usePlaylistItems'
import { usePlaylistSelection } from '@/features/playlists/usePlaylistSelection'
import type { IPlaylist } from '@/models/playlist'
import type { IPlaylistItem } from '@/models/playlistItem'
import { cn } from '@/utils/cn'

type ChoosingFor = 'source' | 'destination' | null
type Confirming = 'discard' | 'leave' | null

const DESTINATION_PANEL_ID = 'destination-panel'

/** The whole destination panel as a drop target: dropping here appends. */
function DestinationDropZone({ isDragActive, children }: { isDragActive: boolean; children: React.ReactNode }) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: DESTINATION_PANEL_ID, disabled: !isDragActive })

  return (
    <div
      ref={setNodeRef}
      className={cn('min-h-[6rem] rounded-xl transition-colors', isOver && isDragActive && 'bg-brand-muted/30')}>
      {children}

      {isDragActive && (
        <p className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand/60 py-4 text-sm font-medium text-brand">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('copy.dropHint')}
        </p>
      )}
    </div>
  )
}

/**
 * Copy Between Playlists: two playlists side by side, videos copied from one
 * into the other.
 *
 * Two independent `usePlaylistSelection()` instances, with **this page** owning
 * the one rule between them — that they must differ. Feature 001 wrote that
 * division into the hook's own documentation: it knows nothing about roles or
 * whether a pair is valid, because those belong to whichever feature composes
 * two selections.
 */
export function CopyPlaylistsPage() {
  const { t } = useTranslation()

  const source = usePlaylistSelection()
  const destination = usePlaylistSelection()

  const [choosingFor, setChoosingFor] = useState<ChoosingFor>(null)
  const [confirming, setConfirming] = useState<Confirming>(null)
  const [pendingChoice, setPendingChoice] = useState<ChoosingFor>(null)
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())
  const [draggingItem, setDraggingItem] = useState<IPlaylistItem | null>(null)

  const sourceItems = usePlaylistItems(source.selectedId)
  const destinationItems = usePlaylistItems(destination.selectedId)

  const draft = useCopyDraft(destinationItems.items)

  // Both sides must be fully retrieved: duplicate detection compares against
  // the destination's complete contents, and positions are computed within it.
  const canCopy = sourceItems.status === 'ready' && destinationItems.status === 'ready'

  const sensors = useSensors(
    // A small distance so a tap on the handle is not mistaken for a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const visibleSourceItems = useMemo(() => {
    const needle = query.trim().toLowerCase()

    if (needle === '') return sourceItems.items

    return sourceItems.items.filter((item) => item.title.toLowerCase().includes(needle))
  }, [sourceItems.items, query])

  const resetForNewPlaylist = useCallback(() => {
    draft.discard()
    setSelectedIds(new Set())
    setQuery('')
  }, [draft])

  const chooseSource = useCallback(
    (playlist: IPlaylist) => {
      // The rule holds from both directions. Choosing a source that is already
      // the destination would leave the same playlist on both sides, so the
      // destination gives way — the person just said what to copy *from*.
      if (destination.selectedId === playlist.id) destination.clear()

      source.select(playlist)
      resetForNewPlaylist()
      setChoosingFor(null)
    },
    [source, destination, resetForNewPlaylist],
  )

  const chooseDestination = useCallback(
    (playlist: IPlaylist) => {
      destination.select(playlist)
      resetForNewPlaylist()
      setChoosingFor(null)
    },
    [destination, resetForNewPlaylist],
  )

  /** Guarded by the unsaved-changes warning whenever anything is pending. */
  const requestChoose = useCallback(
    (role: 'source' | 'destination') => {
      if (draft.pendingCount > 0 || draft.pending.length > 0) {
        setPendingChoice(role)
        setConfirming('leave')

        return
      }

      setChoosingFor(role)
    },
    [draft.pendingCount, draft.pending.length],
  )

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)

      if (next.has(id)) next.delete(id)
      else next.add(id)

      return next
    })
  }, [])

  const copySelected = useCallback(() => {
    draft.addMany(visibleSourceItems.filter((item) => selectedIds.has(item.id)))
    setSelectedIds(new Set())
  }, [draft, visibleSourceItems, selectedIds])

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      setDraggingItem(sourceItems.items.find((item) => item.id === active.id) ?? null)
    },
    [sourceItems.items],
  )

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      setDraggingItem(null)

      if (!over) return

      const item = sourceItems.items.find((candidate) => candidate.id === active.id)

      if (!item) return

      const overId = String(over.id)

      if (overId === DESTINATION_PANEL_ID) {
        draft.addCopy(item)

        return
      }

      if (overId.startsWith('row:')) {
        const index = draft.destinationDraft.findIndex((row) => `row:${row.key}` === overId)

        if (index !== -1) draft.addCopy(item, index)
      }
    },
    [sourceItems.items, draft],
  )

  if (choosingFor !== null) {
    const isSource = choosingFor === 'source'

    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {isSource ? t('copy.source') : t('copy.destination')}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {isSource ? t('copy.selectSource') : t('copy.selectDestination')}
          </p>
        </div>

        <PlaylistPicker
          selectedId={isSource ? source.selectedId : destination.selectedId}
          // The source cannot also be the destination, so it is not offered.
          excludeId={isSource ? destination.selectedId : source.selectedId}
          onSelect={isSource ? chooseSource : chooseDestination}
          label={isSource ? t('copy.source') : t('copy.destination')}
        />
      </div>
    )
  }

  const sourceToolbar = sourceItems.status === 'ready' && sourceItems.items.length > 0 && (
    <div className="flex flex-col gap-2">
      <SearchInput
        value={query}
        onChange={setQuery}
        label={t('copy.searchLabel')}
        placeholder={t('copy.searchVideos')}
        clearLabel={t('copy.clearSearch')}
      />

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-muted/40 px-3 py-2">
        <span className="text-sm font-medium">{t('copy.selectedCount', { count: selectedIds.size })}</span>

        <Button
          variant="ghost"
          onClick={() => {
            setSelectedIds(new Set(visibleSourceItems.map((item) => item.id)))
          }}
          className="h-8 px-2">
          <CheckSquare className="h-4 w-4" aria-hidden="true" />
          {t('copy.selectAll')}
        </Button>

        <Button
          variant="ghost"
          onClick={() => {
            setSelectedIds(new Set())
          }}
          className="h-8 px-2">
          <Square className="h-4 w-4" aria-hidden="true" />
          {t('copy.deselectAll')}
        </Button>

        {/* The non-drag path, at every width — never a narrow-screen fallback. */}
        <Button
          variant="brand"
          onClick={copySelected}
          disabled={!canCopy || selectedIds.size === 0}
          className="ms-auto h-8 px-3">
          {/* Mirrored in Arabic: this arrow means "from here to there". */}
          <MoveRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          {t('copy.copySelected')}
        </Button>
      </div>
    </div>
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}>
      <div className={cn('mx-auto w-full max-w-6xl', draft.pendingCount > 0 && 'pb-28')}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('copy.title')}</h1>

          <p className="mt-1 text-sm text-muted-foreground sm:text-base">{t('copy.subtitle')}</p>
        </div>

        {/* Side by side once there is room; stacked below that, source first, so
            the reading order matches the direction of the copy. */}
        <div className="grid gap-4 lg:grid-cols-2">
          <PlaylistPanel
            role="source"
            playlist={source.selected}
            onChoose={() => {
              requestChoose('source')
            }}
            state={sourceItems}
            toolbar={sourceToolbar || undefined}>
            {sourceItems.items.length > 0 &&
              (visibleSourceItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t('copy.noMatches')}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {visibleSourceItems.map((item) => (
                    <DraggableVideoCard
                      key={item.id}
                      item={item}
                      selected={selectedIds.has(item.id)}
                      onToggleSelect={() => {
                        toggleSelect(item.id)
                      }}
                      disabled={!canCopy}
                    />
                  ))}
                </ul>
              ))}
          </PlaylistPanel>

          <PlaylistPanel
            role="destination"
            playlist={destination.selected}
            onChoose={() => {
              requestChoose('destination')
            }}
            state={destinationItems}
            footer={
              <DuplicateNotice
                willAdd={draft.pendingCount}
                duplicateCount={draft.duplicateCount}
                includeDuplicates={draft.includeDuplicates}
                onIncludeDuplicatesChange={draft.setIncludeDuplicates}
              />
            }>
            {destination.selected !== undefined && (
              <DestinationDropZone isDragActive={draggingItem !== null}>
                <ul className="flex flex-col gap-2">
                  {draft.destinationDraft.map((row) => (
                    <DestinationVideoCard
                      key={row.key}
                      row={row}
                      includeDuplicates={draft.includeDuplicates}
                      isDragActive={draggingItem !== null}
                    />
                  ))}
                </ul>
              </DestinationDropZone>
            )}
          </PlaylistPanel>
        </div>

        <PendingChangesBar
          pendingCount={draft.pendingCount}
          countLabel={t('copy.willAdd', { count: draft.pendingCount })}
          onDiscard={() => {
            setConfirming('discard')
          }}
          onSave={() => {
            // Saving lands in T029.
          }}
          isSaving={false}
        />

        <ConfirmDialog
          open={confirming === 'discard'}
          title={t('confirm.discardCopies.title')}
          message={t('confirm.discardCopies.message')}
          confirmLabel={t('confirm.discardCopies.confirm')}
          onConfirm={() => {
            draft.discard()
            setSelectedIds(new Set())
            setConfirming(null)
          }}
          onCancel={() => {
            setConfirming(null)
          }}
        />

        <ConfirmDialog
          open={confirming === 'leave'}
          title={t('confirm.leaveCopies.title')}
          message={t('confirm.leaveCopies.message')}
          confirmLabel={t('confirm.leaveCopies.confirm')}
          onConfirm={() => {
            setConfirming(null)
            setChoosingFor(pendingChoice)
            setPendingChoice(null)
          }}
          onCancel={() => {
            setConfirming(null)
            setPendingChoice(null)
          }}
        />
      </div>
    </DndContext>
  )
}
