import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { VideoCard } from '@/components/videos/VideoCard'
import type { IBuildEntry } from '@/models/build'
import { cn } from '@/utils/cn'

interface BuildDraftRowProps {
  entry: IBuildEntry
  /** One-based, so the order being assembled is legible. */
  position: number
  /** This entry repeats a video already present — derived, never stored. */
  isDuplicate: boolean
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  disabled?: boolean
}

const CONTROL_CLASSES =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40'

/**
 * One gathered video, with every way to move or drop it.
 *
 * The move buttons are **not** a touch-only fallback. They are always present:
 * the one affordance needing no gesture vocabulary at all, which works for
 * keyboard and screen-reader users without any drag semantics and still works
 * where a drag library misbehaves. They, not the drag handle, are what satisfy
 * the requirement that reordering never depend on dragging.
 *
 * Disabled at the ends rather than hidden, so the control set does not reflow
 * as a row moves.
 *
 * Neither the grip nor the arrows are mirrored in Arabic — a grip's meaning is
 * direction-independent, and vertical direction is unaffected by writing
 * direction.
 */
export function BuildDraftRow({
  entry,
  position,
  isDuplicate,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  disabled = false,
}: BuildDraftRowProps) {
  const { t } = useTranslation()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.key })

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
            aria-label={t('build.dragHandle', { title })}
            className={cn(CONTROL_CLASSES, 'cursor-grab touch-none active:cursor-grabbing')}>
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        }
        badge={
          isDuplicate ? (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {t('build.duplicateBadge')}
            </span>
          ) : undefined
        }
        actions={
          <span className="flex shrink-0 items-center gap-0.5">
            <span className="flex flex-col">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={disabled || isFirst}
                aria-label={t('build.moveUp')}
                className={cn(CONTROL_CLASSES, 'h-5')}>
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onMoveDown}
                disabled={disabled || isLast}
                aria-label={t('build.moveDown')}
                className={cn(CONTROL_CLASSES, 'h-5')}>
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
            </span>

            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              aria-label={t('build.removeFromDraft', { title })}
              className={cn(CONTROL_CLASSES, 'hover:text-destructive')}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </span>
        }
      />
    </li>
  )
}
