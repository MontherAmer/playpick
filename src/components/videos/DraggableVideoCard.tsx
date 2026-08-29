import { useDraggable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { VideoCard } from '@/components/videos/VideoCard'
import type { IPlaylistItem } from '@/models/playlistItem'
import { cn } from '@/utils/cn'

interface DraggableVideoCardProps {
  item: IPlaylistItem
  selected: boolean
  onToggleSelect: () => void
  /** Dragging is unavailable until both playlists have arrived. */
  disabled?: boolean
}

/**
 * A source row: draggable, and selectable without dragging.
 *
 * The checkbox is **not** a fallback for narrow screens. It is the primary
 * accessible path — usable by keyboard and screen reader with no drag semantics
 * at all — and it is present at every width. Cross-panel dragging by keyboard
 * has no natural mapping, so pretending it works would be worse than offering
 * this instead.
 */
export function DraggableVideoCard({ item, selected, onToggleSelect, disabled = false }: DraggableVideoCardProps) {
  const { t } = useTranslation()
  const checkboxId = useId()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    disabled,
    data: { item },
  })

  const title = item.title === '' ? t('playlist.untitledVideo') : item.title

  return (
    // The row stays put and dims; a `DragOverlay` in the page is what follows
    // the cursor. Transforming this element instead would move it inside the
    // panel's own scroll container, which clips it — so the drag appeared to
    // happen *below* the destination list rather than over it.
    <li ref={setNodeRef} className={cn(isDragging && 'opacity-40')}>
      <VideoCard
        item={item}
        dragHandle={
          <button
            type="button"
            {...attributes}
            {...listeners}
            disabled={disabled}
            aria-label={t('copy.dragHandle', { title })}
            className="flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:cursor-grabbing disabled:pointer-events-none disabled:opacity-40">
            {/* Not mirrored in Arabic: a grip's meaning is direction-independent. */}
            <GripVertical className="h-5 w-5" aria-hidden="true" />
          </button>
        }
        leading={
          <span className="flex shrink-0 items-center">
            <input
              id={checkboxId}
              type="checkbox"
              checked={selected}
              disabled={disabled}
              onChange={onToggleSelect}
              className="h-4 w-4 rounded border-input accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            <label htmlFor={checkboxId} className="sr-only">
              {t('copy.selectVideo', { title })}
            </label>
          </span>
        }
      />
    </li>
  )
}
