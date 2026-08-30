import { useEffect, useRef, useState } from 'react'

import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { listAllPlaylistItems } from '@/api/youtube/playlistItems'
import { useAuth } from '@/features/auth/useAuth'
import type { IMergeSource, MergeSourceStatus } from '@/models/merge'
import type { IPlaylist } from '@/models/playlist'
import type { IPlaylistItem } from '@/models/playlistItem'

interface IEntry {
  status: Exclude<MergeSourceStatus, 'pending'>
  items: IPlaylistItem[]
  error: YouTubeErrorCode | null
}

export interface ISelectedPlaylistItems {
  /** One entry per selected playlist, in the order given. */
  sources: IMergeSource[]
  /** Re-reads exactly one playlist. */
  retry: (playlistId: string) => void
}

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

/**
 * Reads the contents of **several** playlists at once, remembering each for the
 * length of the visit.
 *
 * Every other tool reads one playlist, and the obvious shortcut — calling
 * `usePlaylistItems` once per selection — is impossible, because a hook cannot
 * be called a varying number of times. So this owns a map from playlist to its
 * own small state and starts a read for any selection it has not seen.
 *
 * ## What it deliberately does *not* do
 *
 * **It never fetches durations.** Merge renders no video rows, so
 * `listVideoDurations` would buy nothing and cost a request per fifty videos per
 * playlist — eight wasted requests on a six-playlist merge. Items from this hook
 * therefore carry no `durationSeconds`, which is correct here and would be wrong
 * to reuse on a screen that shows rows.
 *
 * **It never records an empty list for a failure.** A failed read stores
 * `'failed'` with its code. Storing `items: []` would be indistinguishable from
 * a genuinely empty playlist and would make the merge quietly too small —
 * producing a playlist missing videos the person selected, which nothing in
 * PlayPick can repair.
 *
 * Reads are per playlist, so one slow or broken playlist neither blocks nor
 * contaminates the others, and each is read **once**: deselecting does not
 * discard what was read, so reselecting is free.
 *
 * Entries are keyed by **account and playlist together**, so one account's
 * contents can never be served into another's session.
 */
export function useSelectedPlaylistItems(playlists: readonly IPlaylist[]): ISelectedPlaylistItems {
  const { user, getAccessToken } = useAuth()
  const userId = user?.id ?? 'signed-out'

  const [entries, setEntries] = useState<ReadonlyMap<string, IEntry>>(() => new Map())

  // Which keys have had a read started, so a re-render never starts a second.
  const startedRef = useRef(new Set<string>())
  // Bumped by `retry` to let one key through again.
  const [attempt, setAttempt] = useState(0)

  const keyFor = (playlistId: string) => `${userId}::${playlistId}`

  /**
   * The selection as one string, so the effect below depends on *what* is
   * selected rather than on an array rebuilt every render. A YouTube playlist id
   * never contains `|`, so splitting it back apart is exact.
   */
  const selectedIds = playlists.map((playlist) => playlist.id).join('|')

  useEffect(() => {
    for (const playlistId of selectedIds === '' ? [] : selectedIds.split('|')) {
      const key = `${userId}::${playlistId}`

      if (startedRef.current.has(key)) continue

      startedRef.current.add(key)

      setEntries((current) => new Map(current).set(key, { status: 'reading', items: [], error: null }))

      void (async () => {
        try {
          // No durations, deliberately — see the note above.
          const items = await listAllPlaylistItems(getAccessToken, playlistId)

          setEntries((current) => new Map(current).set(key, { status: 'read', items, error: null }))
        } catch (cause) {
          // A failure, never an empty playlist.
          setEntries((current) => new Map(current).set(key, { status: 'failed', items: [], error: toErrorCode(cause) }))
        }
      })()
    }

    /**
     * **No cleanup that abandons in-flight reads.**
     *
     * The obvious `let cancelled = false` / `cancelled = true` pattern is wrong
     * here, and wrong in a way that strands a playlist forever: selecting a
     * second playlist while the first is still loading re-runs this effect, the
     * old run's cleanup discards the first playlist's result, and `startedRef`
     * already marks it started — so nothing ever retries it and the summary sits
     * on "still counting" for good.
     *
     * Letting the write land is safe because every entry is keyed by account and
     * playlist. A result for a playlist since deselected is simply never read; a
     * result from a previous account is stored under a key the current account
     * can never look up.
     */
  }, [selectedIds, userId, attempt, getAccessToken])

  const retry = (playlistId: string) => {
    const key = keyFor(playlistId)

    startedRef.current.delete(key)
    setEntries((current) => {
      const next = new Map(current)

      next.delete(key)

      return next
    })
    setAttempt((value) => value + 1)
  }

  const sources: IMergeSource[] = playlists.map((playlist) => {
    const entry = entries.get(keyFor(playlist.id))

    return {
      playlist,
      // No entry yet means the effect has not run for it — pending, not empty.
      status: entry?.status ?? 'pending',
      items: entry?.items ?? [],
      error: entry?.error ?? null,
    }
  })

  return { sources, retry }
}
