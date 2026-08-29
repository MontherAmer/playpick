import { useCallback, useEffect, useRef, useState } from 'react'

import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { listAllPlaylistItems } from '@/api/youtube/playlistItems'
import { listVideoDurations } from '@/api/youtube/videos'
import { useAuth } from '@/features/auth/useAuth'
import type { IPlaylistItem } from '@/models/playlistItem'

export type PlaylistItemsStatus = 'idle' | 'loading' | 'ready' | 'failed'

export interface IRetrievalProgress {
  retrieved: number
  total: number
}

export interface IPlaylistItemsState {
  status: PlaylistItemsStatus
  error: YouTubeErrorCode | null
  items: IPlaylistItem[]
  progress: IRetrievalProgress | null
  reload: () => void
}

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

function isAbortError(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === 'AbortError'
}

/**
 * Retrieves one playlist's items in full. Retrieval only — no draft, no
 * mutation — so a screen needing two playlists calls it twice.
 *
 * `status` reaches `'ready'` only once the **whole** playlist has arrived.
 * Copying computes duplicate detection and insert positions against the
 * destination's complete contents, so a partly-retrieved list would
 * under-report duplicates and place videos wrongly — both silently.
 *
 * Durations are decorative: `listVideoDurations` failing must never fail the
 * screen, so its rejection is caught and dropped here.
 *
 * Deliberately duplicates the retrieval half of `useReorderDraft` rather than
 * extracting a shared hook: feature 003 is merged and verified, and refactoring
 * it for this feature's benefit would put a working write path at risk. The
 * extraction is recorded as a follow-up for when a third tool needs it.
 */
export function usePlaylistItems(playlistId: string | undefined): IPlaylistItemsState {
  const { getAccessToken } = useAuth()

  const [status, setStatus] = useState<PlaylistItemsStatus>(playlistId === undefined ? 'idle' : 'loading')
  const [error, setError] = useState<YouTubeErrorCode | null>(null)
  const [items, setItems] = useState<IPlaylistItem[]>([])
  const [progress, setProgress] = useState<IRetrievalProgress | null>(null)
  const [attempt, setAttempt] = useState(0)

  // Discriminates responses so a superseded request cannot overwrite newer
  // state — a reload during an in-flight load, or a different playlist chosen.
  const requestIdRef = useRef(0)

  const reload = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  // Reset during render rather than in an effect: an effect would paint the
  // previous playlist's items once under the new playlist before clearing them,
  // which is the cascading render the React Compiler rejects.
  const [renderedFor, setRenderedFor] = useState<{ playlistId: string | undefined; attempt: number }>({
    playlistId,
    attempt,
  })

  if (renderedFor.playlistId !== playlistId || renderedFor.attempt !== attempt) {
    setRenderedFor({ playlistId, attempt })
    setStatus(playlistId === undefined ? 'idle' : 'loading')
    setError(null)
    setItems([])
    setProgress(null)
  }

  useEffect(() => {
    if (playlistId === undefined) return

    const requestId = ++requestIdRef.current
    const controller = new AbortController()
    const isCurrent = () => requestId === requestIdRef.current && !controller.signal.aborted

    const run = async () => {
      let retrieved: IPlaylistItem[]

      try {
        retrieved = await listAllPlaylistItems(
          getAccessToken,
          playlistId,
          (count, total) => {
            if (isCurrent()) setProgress({ retrieved: count, total })
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

      setItems(retrieved)
      setStatus('ready')

      if (retrieved.length === 0) return

      try {
        const durations = await listVideoDurations(
          getAccessToken,
          retrieved.map((item) => item.videoId),
          controller.signal,
        )

        if (!isCurrent() || durations.size === 0) return

        setItems((current) =>
          current.map((item) => {
            const durationSeconds = durations.get(item.videoId)

            return durationSeconds === undefined ? item : { ...item, durationSeconds }
          }),
        )
      } catch {
        // Decorative by contract. A missing badge is not worth surfacing, and
        // the list is already usable without it.
      }
    }

    void run()

    return () => {
      controller.abort()
    }
  }, [playlistId, attempt, getAccessToken])

  return { status, error, items, progress, reload }
}
