import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { VideoCard } from '@/components/videos/VideoCard'
import type { IPlaylistItem } from '@/models/playlistItem'
import { cn } from '@/utils/cn'

interface SortableVideoCardProps {
  item: IPlaylistItem
  /** One-based, for display. */
  position: number
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  /** Rearranging is unavailable until the whole playlist has arrived. */
  disabled?: boolean
}

const CONTROL_CLASSES =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40'

/**
 * A video row with all three ways to move it.
 *
 * The move buttons are **not** a touch-only fallback. They are always present:
 * the one affordance that needs no gesture vocabulary at all, works for
 * keyboard and screen-reader users without any drag semantics, and still works
 * on a device where a drag library misbehaves.
 *
 * Neither the grip nor the arrows are mirrored in Arabic — a grip's meaning is
 * direction-independent, and vertical direction is unaffected by writing
 * direction.
 */
export function SortableVideoCard({
  item,
  position,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  disabled = false,
}: SortableVideoCardProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
  })

  const title = item.title === '' ? t('playlist.untitledVideo') : item.title

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'relative z-10 opacity-80')}>
      <VideoCard
        item={item}
        position={position}
        dragHandle={
          <button
            type="button"
            {...attributes}
            {...listeners}
            disabled={disabled}
            aria-label={t('reorder.dragHandle', { title })}
            className={cn(CONTROL_CLASSES, 'cursor-grab touch-none active:cursor-grabbing')}>
            <GripVertical className="h-5 w-5" aria-hidden="true" />
          </button>
        }
        actions={
          <span className="flex shrink-0 flex-col">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={disabled || isFirst}
              aria-label={t('reorder.moveUp')}
              className={cn(CONTROL_CLASSES, 'h-6')}>
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onMoveDown}
              disabled={disabled || isLast}
              aria-label={t('reorder.moveDown')}
              className={cn(CONTROL_CLASSES, 'h-6')}>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </span>
        }
      />
    </li>
  )
}
