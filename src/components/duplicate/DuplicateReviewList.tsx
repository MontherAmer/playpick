import { Info, ListVideo } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/common/EmptyState'
import { VideoCard } from '@/components/videos/VideoCard'
import type { IPlaylistItem } from '@/models/playlistItem'

interface DuplicateReviewListProps {
  items: IPlaylistItem[]
}

/**
 * Every video in the source, in the source's own order.
 *
 * ## A position is shown here, unlike Copy's list
 *
 * The order is the point: it is what the copy will reproduce. In a copy list a
 * running number would imply an ordering nobody chose, which is why `VideoCard`
 * makes `position` optional — here it is exactly what someone is checking.
 *
 * ## Repeats appear as separate rows
 *
 * Because they are separate items. A playlist holding one video three times
 * shows three rows, and all three will be copied.
 *
 * ## Unavailable videos are shown, not hidden
 *
 * They cannot be copied, and `VideoCard` already marks them. Hiding them would
 * leave someone unable to see why the copy is shorter than the playlist they are
 * looking at — the count of what cannot be copied is stated above, and this is
 * where they can see *which*.
 *
 * There is **no selection and no reordering**. The copy is the whole playlist in
 * its own order; choosing a subset is what Build is for, and arranging one is
 * what Reorder is for.
 */
export function DuplicateReviewList({ items }: DuplicateReviewListProps) {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('duplicate.review')}
      className="flex min-w-0 flex-col rounded-xl border bg-card p-3 shadow-card sm:p-4">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {t('duplicate.review')}
      </h2>

      {items.length === 0 ? (
        <EmptyState icon={ListVideo} title={t('duplicate.reviewNotice')} className="py-8" />
      ) : (
        <>
          {/* Said plainly. The person is looking at a list of videos that are
              not yet anywhere else. */}
          <p className="mb-2 inline-flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('duplicate.reviewNotice')}
          </p>

          {/* Its own scroll container, so the duplicate control stays reachable
              beside a two-hundred-video playlist rather than a page below it. */}
          <ul className="max-h-[32rem] min-h-0 list-none space-y-2 overflow-y-auto p-0">
            {items.map((item, index) => (
              <li key={item.id}>
                <VideoCard item={item} position={index + 1} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
