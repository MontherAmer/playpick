import { useCallback, useEffect, useRef, useState } from 'react'

import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { listAllPlaylistItems } from '@/api/youtube/playlistItems'
import { listVideoDurations } from '@/api/youtube/videos'
import { useAuth } from '@/features/auth/useAuth'
import type { IPlaylistItem } from '@/models/playlistItem'

export type ReorderDraftStatus = 'idle' | 'loading' | 'ready' | 'failed'

export interface ILoadProgress {
  retrieved: number
  total: number
}

export interface IReorderDraft {
  status: ReorderDraftStatus
  error: YouTubeErrorCode | null
  /** The order as retrieved. Immutable for the life of the editor. */
  retrieved: IPlaylistItem[]
  /** The working arrangement. Always a permutation of `retrieved`. */
  draft: IPlaylistItem[]
  loadProgress: ILoadProgress | null
  retry: () => void
}

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

function isAbortError(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === 'AbortError'
}

/**
 * Holds a playlist's running order and the person's working arrangement of it.
 *
 * `status` reaches `'ready'` only once the *whole* playlist has arrived.
 * Rearranging a partly-retrieved list would compute positions against an order
 * that is not the real one and save a wrong result, so the editor stays
 * read-only until retrieval finishes.
 *
 * Durations are decorative: `listVideoDurations` failing must never fail the
 * screen, so its rejection is caught and dropped here rather than propagated.
 */
export function useReorderDraft(playlistId: string | undefined): IReorderDraft {
  const { getAccessToken } = useAuth()

  const [status, setStatus] = useState<ReorderDraftStatus>(playlistId === undefined ? 'idle' : 'loading')
  const [error, setError] = useState<YouTubeErrorCode | null>(null)
  const [retrieved, setRetrieved] = useState<IPlaylistItem[]>([])
  const [draft, setDraft] = useState<IPlaylistItem[]>([])
  const [loadProgress, setLoadProgress] = useState<ILoadProgress | null>(null)

  // Bumped to re-run retrieval on demand without re-deriving anything else.
  const [attempt, setAttempt] = useState(0)

  // Discriminates responses so a superseded request cannot overwrite newer
  // state — a retry during an in-flight load, or a different playlist chosen.
  const requestIdRef = useRef(0)

  const retry = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  // Reset during render rather than in an effect: an effect would paint the
  // previous playlist's items once under the new playlist before clearing them,
  // and the React Compiler rightly rejects the cascading render that causes.
  const [renderedFor, setRenderedFor] = useState<{ playlistId: string | undefined; attempt: number }>({
    playlistId,
    attempt,
  })

  if (renderedFor.playlistId !== playlistId || renderedFor.attempt !== attempt) {
    setRenderedFor({ playlistId, attempt })
    setStatus(playlistId === undefined ? 'idle' : 'loading')
    setError(null)
    setRetrieved([])
    setDraft([])
    setLoadProgress(null)
  }

  useEffect(() => {
    if (playlistId === undefined) return

    const requestId = ++requestIdRef.current
    const controller = new AbortController()
    const isCurrent = () => requestId === requestIdRef.current && !controller.signal.aborted

    const run = async () => {
      let items: IPlaylistItem[]

      try {
        items = await listAllPlaylistItems(
          getAccessToken,
          playlistId,
          (retrievedCount, total) => {
            if (isCurrent()) setLoadProgress({ retrieved: retrievedCount, total })
          },
          controller.signal,
        )
      } catch (cause) {
        if (isAbortError(cause) || !isCurrent()) return

        setStatus('failed')
        setError(toErrorCode(cause))

        return
      }

      if (!isCurrent()) return

      // Show the list as soon as it is complete. Durations arrive after, and
      // their absence is never worth delaying a usable screen for.
      setRetrieved(items)
      setDraft(items)
      setStatus('ready')

      if (items.length === 0) return

      try {
        const durations = await listVideoDurations(
          getAccessToken,
          items.map((item) => item.videoId),
          controller.signal,
        )

        if (!isCurrent() || durations.size === 0) return

        const decorate = (list: IPlaylistItem[]) =>
          list.map((item) => {
            const durationSeconds = durations.get(item.videoId)

            return durationSeconds === undefined ? item : { ...item, durationSeconds }
          })

        setRetrieved(decorate)
        setDraft(decorate)
      } catch {
        // Decorative by contract. A missing badge is not a failure worth
        // surfacing, and the list is already usable without it.
      }
    }

    void run()

    return () => {
      controller.abort()
    }
  }, [playlistId, attempt, getAccessToken])

  return { status, error, retrieved, draft, loadProgress, retry }
}
