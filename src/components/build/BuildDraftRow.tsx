import { useTranslation } from 'react-i18next'

import { VideoCard } from '@/components/videos/VideoCard'
import type { IBuildEntry } from '@/models/build'

interface BuildDraftRowProps {
  entry: IBuildEntry
  /** One-based, so the order being assembled is legible. */
  position: number
  /** This entry repeats a video already present — derived, never stored. */
  isDuplicate: boolean
}

/**
 * One gathered video, in the order it will be added.
 *
 * `VideoCard` with a position and a badge. The drag handle, the move controls
 * and the remove control arrive with the curation story; the row is deliberately
 * inert until then rather than offering affordances that do nothing.
 */
export function BuildDraftRow({ entry, position, isDuplicate }: BuildDraftRowProps) {
  const { t } = useTranslation()

  return (
    <VideoCard
      item={entry.item}
      position={position}
      badge={
        isDuplicate ? (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {t('build.duplicateBadge')}
          </span>
        ) : undefined
      }
    />
  )
}
