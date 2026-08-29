import { useCallback, useMemo, useState } from 'react'

import { buildAddPlan, markRepeats } from '@/features/build/buildAddPlan'
import type { IBuildEntry, IBuildStep } from '@/models/build'
import type { IPlaylistItem } from '@/models/playlistItem'

export interface IBuildDraft {
  /** The gathered videos, in the order they will be added. */
  entries: IBuildEntry[]
  /** Aligned with `entries` by index. Derived every render, never stored. */
  duplicateFlags: boolean[]
  duplicateCount: number
  includeDuplicates: boolean
  setIncludeDuplicates: (value: boolean) => void
  /** What will actually be sent. Derived, never stored. */
  plan: IBuildStep[]
  /** `plan.length` — the one number shown as the count, the estimate and the progress total. */
  additionCount: number
  add: (item: IPlaylistItem, sourcePlaylistId: string) => void
  addMany: (items: readonly IPlaylistItem[], sourcePlaylistId: string) => void
  /** Whether any entry holds this video — for marking a source row as already taken. */
  containsVideo: (videoId: string) => boolean
  discard: () => void
}

/** Unique per intent, and deliberately unrelated to any video or membership id. */
let nextKey = 0

function mintKey(): string {
  nextKey += 1

  return `build-${String(nextKey)}`
}

/**
 * The videos gathered so far, waiting to become a playlist.
 *
 * Everything here is local. **No method issues a request**, and nothing reaches
 * YouTube until a save runs — which itself runs only after an explicit
 * confirmation.
 *
 * The draft is the feature's centre: it outlives the source playlist being
 * browsed, so switching sources gathers rather than restarts.
 *
 * `duplicateFlags`, `duplicateCount`, `plan` and `additionCount` are derived on
 * every render rather than stored. That is what lets a change of destination, a
 * removal or a reorder update all of them at once, and it is why an entry
 * carries no frozen `isDuplicate` — see `markRepeats`.
 */
export function useBuildDraft(destinationVideoIds: ReadonlySet<string>): IBuildDraft {
  const [entries, setEntries] = useState<IBuildEntry[]>([])
  const [includeDuplicates, setIncludeDuplicates] = useState(false)

  const add = useCallback((item: IPlaylistItem, sourcePlaylistId: string) => {
    setEntries((current) => [
      ...current,
      // A fresh key per addition: two copies of one video must be two
      // independent entries, so that removing one leaves the other.
      { key: mintKey(), videoId: item.videoId, item, sourcePlaylistId },
    ])
  }, [])

  const addMany = useCallback((items: readonly IPlaylistItem[], sourcePlaylistId: string) => {
    setEntries((current) => [
      ...current,
      ...items.map((item) => ({ key: mintKey(), videoId: item.videoId, item, sourcePlaylistId })),
    ])
  }, [])

  const discard = useCallback(() => {
    setEntries([])
  }, [])

  const duplicateFlags = useMemo(() => markRepeats(destinationVideoIds, entries), [destinationVideoIds, entries])

  const duplicateCount = useMemo(() => duplicateFlags.filter(Boolean).length, [duplicateFlags])

  const plan = useMemo(
    () => buildAddPlan(destinationVideoIds, entries, includeDuplicates),
    [destinationVideoIds, entries, includeDuplicates],
  )

  const draftVideoIds = useMemo(() => new Set(entries.map((entry) => entry.videoId)), [entries])

  const containsVideo = useCallback((videoId: string) => draftVideoIds.has(videoId), [draftVideoIds])

  return {
    entries,
    duplicateFlags,
    duplicateCount,
    includeDuplicates,
    setIncludeDuplicates,
    plan,
    additionCount: plan.length,
    add,
    addMany,
    containsVideo,
    discard,
  }
}
