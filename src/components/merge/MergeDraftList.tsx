import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Info, Layers } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/common/EmptyState'
import { MergeDraftRow } from '@/components/merge/MergeDraftRow'
import { VideoCard } from '@/components/videos/VideoCard'
import type { IMergeEntry } from '@/models/merge'

interface MergeDraftListProps {
  entries: IMergeEntry[]
  /** Aligned with `entries`: this one will be skipped as a repeat. */
  duplicateFlags: boolean[]
  onMove: (fromIndex: number, toIndex: number) => void
  disabled?: boolean
}

/**
 * Every video the merge will add, in the order it will be added.
 *
 * ## What is listed, and what is not
 *
 * **Duplicates that will be excluded are listed and marked.** Seeing what was
 * detected is the point of detecting it; a list that silently omitted them would
 * leave someone unable to understand why the count is lower than the total.
 *
 * **Unavailable videos are absent entirely.** They cannot be added and cannot
 * meaningfully be arranged, and the summary already reports them as its own
 * figure — an inert row in a list whose purpose is arranging what will be added
 * would be noise.
 *
 * ## The overlay is not optional
 *
 * The list scrolls in its own container, so a row moved by a CSS transform is
 * clipped at that container's edge the moment it is dragged past it. A
 * `DragOverlay` renders the dragged card outside the scrolling box instead — a
 * defect already found and fixed twice in this codebase, and not worth finding a
 * third time.
 */
export function MergeDraftList({ entries, duplicateFlags, onMove, disabled = false }: MergeDraftListProps) {
  const { t } = useTranslation()

  const [draggingId, setDraggingId] = useState<string | null>(null)

  const ids = useMemo(() => entries.map((entry) => entry.id), [entries])
  const dragged = entries.find((entry) => entry.id === draggingId)

  const sensors = useSensors(
    // A small distance so a tap on the handle is not mistaken for a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    setDraggingId(String(active.id))
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingId(null)

    // Dropped outside the list, or back where it started. `move` treats both as
    // a no-op anyway; returning early keeps that from depending on it.
    if (!over || active.id === over.id) return

    onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
  }

  return (
    <section
      aria-label={t('merge.draft')}
      className="flex min-h-[18rem] min-w-0 flex-col rounded-xl border bg-card p-3 shadow-card sm:p-4">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">{t('merge.draft')}</h2>

      {entries.length === 0 ? (
        <EmptyState icon={Layers} title={t('merge.draftEmpty')} className="flex-1" />
      ) : (
        <>
          {/* Said plainly, not implied. The person is looking at a list of
              videos that are not yet anywhere. */}
          <p className="mb-2 inline-flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('merge.draftNotice')}
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <ul className="max-h-[32rem] min-h-0 flex-1 list-none space-y-2 overflow-y-auto p-0">
                {entries.map((entry, index) => (
                  <MergeDraftRow
                    key={entry.id}
                    entry={entry}
                    position={index + 1}
                    isDuplicate={duplicateFlags[index] === true}
                    isFirst={index === 0}
                    isLast={index === entries.length - 1}
                    disabled={disabled}
                    onMoveUp={() => {
                      onMove(index, index - 1)
                    }}
                    onMoveDown={() => {
                      onMove(index, index + 1)
                    }}
                  />
                ))}
              </ul>
            </SortableContext>

            {/* Outside the scrolling box — see the note above. */}
            <DragOverlay>{dragged ? <VideoCard item={dragged.item} compact /> : null}</DragOverlay>
          </DndContext>
        </>
      )}
    </section>
  )
}
