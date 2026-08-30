import { useMemo } from 'react'

import type { YouTubeErrorCode } from '@/api/youtube/errors'
import { LARGE_DUPLICATE_THRESHOLD, buildDuplicatePlan } from '@/features/duplicate/buildDuplicatePlan'
import {
  usePlaylistItems,
  type IRetrievalProgress,
  type PlaylistItemsStatus,
} from '@/features/playlists/usePlaylistItems'
import type { IBuildStep } from '@/models/build'
import type { IDuplicateSummary } from '@/models/duplicate'
import type { IPlaylist } from '@/models/playlist'
import type { IPlaylistItem } from '@/models/playlistItem'

export interface IDuplicateSource {
  status: PlaylistItemsStatus
  error: YouTubeErrorCode | null
  /** The source's contents, in its own order. Meaningful only at `'ready'`. */
  items: IPlaylistItem[]
  progress: IRetrievalProgress | null
  /** What will be added, in order, with every repeat intact. */
  plan: IBuildStep[]
  summary: IDuplicateSummary
  /** Re-reads the source without re-choosing it. */
  reload: () => void
}

/**
 * The chosen source playlist and everything derived from it.
 *
 * A thin layer over `usePlaylistItems`: it retrieves nothing itself, it derives
 * the plan and the summary from what that hook returns, and it forwards
 * `reload` so a failed retrieval can be retried without re-choosing the source.
 *
 * ## Nothing is held
 *
 * Unlike Merge, where the merged order became state so it could be rearranged,
 * Duplicate reproduces an order and never lets anyone change it. So there is no
 * state here at all — the plan and every count recompute on each render from the
 * retrieved items, and nothing can go stale.
 *
 * ## `status` is passed through, not reinterpreted
 *
 * `'ready'` means the **whole** playlist has arrived. Planning from a partial
 * retrieval would produce a copy that is silently short, and PlayPick can
 * neither delete a playlist nor remove a video from one — so there would be no
 * way back. `isLoading` therefore blocks duplicating rather than merely
 * annotating it.
 *
 * This hook issues no mutating request. Nothing in it writes.
 */
export function useDuplicateSource(source: IPlaylist | undefined): IDuplicateSource {
  const { status, error, items, progress, reload } = usePlaylistItems(source?.id)

  const plan = useMemo(() => buildDuplicatePlan(items), [items])

  const summary = useMemo<IDuplicateSummary>(() => {
    const isLoading = status === 'idle' || status === 'loading'

    return {
      totalItems: plan.totalItems,
      copyableCount: plan.steps.length,
      unavailableCount: plan.unavailableCount,
      repeatedCount: plan.repeatedCount,
      isLoading,
      // Only once the retrieval has finished: an unread playlist and an empty
      // one both hold zero items, and refusing on the first would be refusing
      // on something not yet known.
      hasNothingToCopy: !isLoading && status !== 'failed' && plan.steps.length === 0,
      isLargeDuplicate: plan.steps.length >= LARGE_DUPLICATE_THRESHOLD,
    }
  }, [plan, status])

  return { status, error, items, progress, plan: plan.steps, summary, reload }
}
