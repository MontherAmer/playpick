import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { VideoCard } from '@/components/videos/VideoCard'
import type { IMergeEntry } from '@/models/merge'
import { cn } from '@/utils/cn'

interface MergeDraftRowProps {
  entry: IMergeEntry
  /** One-based, so the order being arranged is legible. */
  position: number
  /** This entry repeats a video already seen, or one already in the destination. Derived. */
  isDuplicate: boolean
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  disabled?: boolean
}

const CONTROL_CLASSES =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40'

/**
 * One video the merge will add, and every way to move it.
 *
 * The move buttons are **not** a touch-only fallback. They are always present:
 * the one affordance needing no gesture vocabulary, which works for keyboard and
 * screen-reader users without any drag semantics and still works where a drag
 * library misbehaves. They, not the grip, are what satisfy the requirement that
 * reordering never depend on dragging.
 *
 * Disabled at the ends rather than hidden, so the control set does not reflow as
 * a row moves.
 *
 * **No remove control**, unlike Build's equivalent row. Draft membership comes
 * from the source selection, which is where videos are added and removed. A
 * per-row delete would create a second, invisible kind of state — "this one was
 * individually excluded" — that every reconciliation would then have to preserve.
 *
 * Neither the grip nor the arrows are mirrored in Arabic: a grip's meaning is
 * direction-independent, and vertical direction is unaffected by writing
 * direction.
 *
 * No duration is shown, and none is fetched — merge reads the most playlists of
 * any tool, and a decorative badge is not worth a request per fifty videos.
 */
export function MergeDraftRow({
  entry,
  position,
  isDuplicate,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  disabled = false,
}: MergeDraftRowProps) {
  const { t } = useTranslation()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  })

  const title = entry.item.title === '' ? t('playlist.untitledVideo') : entry.item.title

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'relative z-10 opacity-80')}>
      <VideoCard
        item={entry.item}
        position={position}
        compact
        dragHandle={
          <button
            type="button"
            {...attributes}
            {...listeners}
            disabled={disabled}
            aria-label={t('merge.dragHandle', { title })}
            className={cn(CONTROL_CLASSES, 'cursor-grab touch-none active:cursor-grabbing')}>
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        }
        badge={
          isDuplicate ? (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {t('merge.alreadyThere')}
            </span>
          ) : undefined
        }
        actions={
          <span className="flex shrink-0 flex-col">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={disabled || isFirst}
              aria-label={t('merge.moveUp')}
              className={cn(CONTROL_CLASSES, 'h-5')}>
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onMoveDown}
              disabled={disabled || isLast}
              aria-label={t('merge.moveDown')}
              className={cn(CONTROL_CLASSES, 'h-5')}>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </span>
        }
      />
    </li>
  )
}
