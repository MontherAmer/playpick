import { useState } from 'react'

import { useAuth } from '@/features/auth/useAuth'
import { usePlaylistItems, type IPlaylistItemsState } from '@/features/playlists/usePlaylistItems'
import type { IPlaylistItem } from '@/models/playlistItem'

type Memo = ReadonlyMap<string, IPlaylistItem[]>

/**
 * A source playlist's videos, remembered for the length of this visit.
 *
 * `usePlaylistItems` clears and refetches whenever its playlist changes — right
 * for Reorder and Copy, where switching means abandoning the old playlist.
 * Building is the opposite: switching between sources and coming back is the
 * *normal* interaction, so the same behaviour would make ordinary use the most
 * wasteful thing the tool does.
 *
 * ## Why the decision is made at the moment of switching
 *
 * The obvious implementation — withhold the playlist id as soon as its items are
 * remembered — is wrong, and quietly so. `usePlaylistItems` reaches `'ready'`
 * **before** it fetches durations; withholding the id at that instant aborts the
 * in-flight duration request, so a first visit would permanently lose its
 * duration badges.
 *
 * So `liveId` is decided **once, when the selected playlist changes**: already
 * remembered means serve the memo and issue nothing, otherwise hand the id down
 * and keep recording what arrives — including the durations that land after
 * `'ready'`.
 *
 * ## Deliberately minimal
 *
 * No eviction, no expiry, no revalidation, nothing shared outside this hook. It
 * is a memo of one visit, not a cache layer, because the constitution forbids
 * building caching infrastructure ahead of a need for it.
 *
 * Entries are keyed by **account and playlist together**, so one account's
 * contents can never be served into another's session — a stronger guarantee
 * than clearing on sign-out, and one that cannot be defeated by timing.
 *
 * Nothing is recorded until a retrieval reaches `'ready'`: a failed or abandoned
 * one leaves the memo untouched, so retrying is a real retry.
 */
export function useSourceItems(playlistId: string | undefined): IPlaylistItemsState {
  const { user } = useAuth()
  const userId = user?.id ?? 'signed-out'

  const [memo, setMemo] = useState<Memo>(() => new Map())

  const keyFor = (id: string | undefined) => (id === undefined ? undefined : `${userId}::${id}`)
  const cacheKey = keyFor(playlistId)

  /**
   * Which playlist the live hook is serving, and which selection that decision
   * was made for.
   *
   * Adjusted during render rather than in an effect: an effect would hand the
   * previous playlist's id down for one committed render, which is the
   * cascading update the React Compiler rejects.
   */
  const [handled, setHandled] = useState<{ selected: string | undefined; liveId: string | undefined }>(() => {
    const key = keyFor(playlistId)

    return { selected: playlistId, liveId: key !== undefined ? playlistId : undefined }
  })

  if (handled.selected !== playlistId) {
    const known = cacheKey !== undefined && memo.has(cacheKey)

    setHandled({ selected: playlistId, liveId: known ? undefined : playlistId })
  }

  const isServingLive = handled.selected === playlistId && handled.liveId !== undefined

  // `undefined` is the documented idle state: no request is issued at all.
  const live = usePlaylistItems(isServingLive ? handled.liveId : undefined)

  // Recorded during render, and re-recorded as durations arrive, so the memo
  // holds the finished list rather than the one from the instant before.
  if (isServingLive && cacheKey !== undefined && live.status === 'ready' && memo.get(cacheKey) !== live.items) {
    const next = new Map(memo)

    next.set(cacheKey, live.items)
    setMemo(next)
  }

  const liveReload = live.reload

  // A plain function, not a `useCallback`: this hook returns early when it
  // serves the memo, and the compiler cannot preserve manual memoization across
  // that. It auto-memoizes anyway, and nothing depends on this identity.
  const reload = () => {
    setMemo((current) => {
      if (cacheKey === undefined) return current

      const next = new Map(current)

      next.delete(cacheKey)

      return next
    })

    // Back to live for this playlist, whether it was being served from the memo
    // or not, so a reload always reaches the network.
    setHandled({ selected: playlistId, liveId: playlistId })
    liveReload()
  }

  if (!isServingLive) {
    const remembered = cacheKey === undefined ? undefined : memo.get(cacheKey)

    if (remembered !== undefined) {
      // Resolved synchronously, with no loading flash — the point of the memo.
      return { status: 'ready', error: null, items: remembered, progress: null, reload }
    }
  }

  return { ...live, reload }
}
