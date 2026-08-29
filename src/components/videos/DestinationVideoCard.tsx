import { useDroppable } from '@dnd-kit/core'
import { CircleAlert, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { VideoCard } from '@/components/videos/VideoCard'
import type { IDestinationRow } from '@/features/copy/buildCopyPlan'
import { cn } from '@/utils/cn'

interface DestinationVideoCardProps {
  row: IDestinationRow
  /**
   * One-based position in the destination as it will be after saving.
   *
   * Absent for a row that will not be saved — an excluded duplicate keeps its
   * place in the list but takes no number, because numbering it would claim a
   * position it is never going to occupy.
   */
  position?: number
  /** Excluded duplicates are shown differently from ones being added. */
  includeDuplicates: boolean
  /** Something is being dragged, so drop targets should show themselves. */
  isDragActive: boolean
}

/**
 * A destination row: a drop target, and marked when it is not yet on YouTube.
 *
 * Pending and already-synced rows are distinguished by a **dashed border and a
 * worded badge**, never by a tint alone. A person who cannot see colour still
 * has to be able to tell what has been sent from what has not — and that is
 * exactly the distinction this whole tool turns on.
 */
export function DestinationVideoCard({ row, position, includeDuplicates, isDragActive }: DestinationVideoCardProps) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: `row:${row.key}`, disabled: !isDragActive })

  const pending = row.pending
  const isExcluded = pending !== undefined && pending.isDuplicate && !includeDuplicates

  return (
    <li ref={setNodeRef} className={cn('rounded-xl', isOver && isDragActive && 'ring-2 ring-brand/60')}>
      <VideoCard
        item={row.item}
        position={position}
        className={cn(
          pending !== undefined && 'border-dashed',
          isExcluded && 'opacity-60',
          isOver && isDragActive && 'bg-brand-muted/40',
        )}
        badge={
          pending === undefined ? undefined : (
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              {pending.isDuplicate ? (
                <>
                  <CircleAlert className="h-3 w-3" aria-hidden="true" />
                  {t('copy.duplicateBadge')}
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  {t('copy.pendingBadge')}
                </>
              )}
            </span>
          )
        }
      />
    </li>
  )
}
