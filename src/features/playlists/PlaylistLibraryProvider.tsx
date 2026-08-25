import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { listMyPlaylists } from '@/api/youtube/playlists'
import { appendPlaylistPage } from '@/features/playlists/playlistPages'
import {
  PlaylistLibraryContext,
  type IPlaylistLibrary,
  type PlaylistLibraryStatus,
} from '@/features/playlists/PlaylistLibraryContext'
import { useAuth } from '@/features/auth/useAuth'
import type { IPlaylist } from '@/models/playlist'

interface ILibraryState {
  playlists: IPlaylist[]
  status: PlaylistLibraryStatus
  error: YouTubeErrorCode | null
  isLoadingMore: boolean
  loadMoreError: YouTubeErrorCode | null
  /** Cursor for the next page. Internal — consumers see the derived `hasMore`. */
  nextPageToken?: string
  totalResults: number
}

const INITIAL_STATE: ILibraryState = {
  playlists: [],
  status: 'idle',
  error: null,
  isLoadingMore: false,
  loadMoreError: null,
  totalResults: 0,
}

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

/**
 * Owns the playlists retrieved for the connected account, so every selection
 * surface shares one library and one retrieval.
 *
 * Retrieval is lazy: mounting this provider issues no request. The first page is
 * fetched when `usePlaylistLibrary` is first consumed, which keeps the cost at
 * zero in a tree where nothing displays playlists.
 */
export function PlaylistLibraryProvider({ children }: { children: ReactNode }) {
  const { user, getAccessToken } = useAuth()
  const [state, setState] = useState<ILibraryState>(INITIAL_STATE)

  // Discriminates responses so a superseded request cannot overwrite newer
  // state — a refresh during an in-flight load, or a sign-in as someone else.
  const requestIdRef = useRef(0)
  // Whether a first-page retrieval has been started, so repeated consumers
  // share one request instead of each triggering their own.
  const hasStartedRef = useRef(false)
  // Guards `loadMore` against a double press. A ref rather than `isLoadingMore`
  // because two presses in one tick would both read the pre-render state.
  const loadMoreInFlightRef = useRef(false)

  const retrieveFirstPage = useCallback(async () => {
    const requestId = ++requestIdRef.current

    // A continuation still in flight is abandoned by the bumped request id, so
    // its slots are cleared here rather than waiting for it to settle.
    loadMoreInFlightRef.current = false
    setState((current) => ({ ...current, status: 'loading', error: null, isLoadingMore: false, loadMoreError: null }))

    try {
      const page = await listMyPlaylists(getAccessToken)

      if (requestIdRef.current !== requestId) return

      setState({
        playlists: page.playlists,
        status: 'ready',
        error: null,
        isLoadingMore: false,
        loadMoreError: null,
        nextPageToken: page.nextPageToken,
        totalResults: page.totalResults,
      })
    } catch (cause) {
      if (requestIdRef.current !== requestId) return

      // A failed first page leaves nothing to show, so the list is cleared
      // rather than left in a state the error message would contradict.
      setState({
        playlists: [],
        status: 'error',
        error: toErrorCode(cause),
        isLoadingMore: false,
        loadMoreError: null,
        nextPageToken: undefined,
        totalResults: 0,
      })
    }
  }, [getAccessToken])

  const loadFirstPage = useCallback(() => {
    if (hasStartedRef.current) return

    hasStartedRef.current = true
    void retrieveFirstPage()
  }, [retrieveFirstPage])

  const { status, nextPageToken } = state

  const loadMore = useCallback(() => {
    // `status === 'ready'` matters as much as the cursor: during a refresh the
    // previous cursor is still in state, and continuing from it would append a
    // page of the library being discarded.
    if (status !== 'ready' || nextPageToken === undefined || loadMoreInFlightRef.current) return

    loadMoreInFlightRef.current = true

    const requestId = requestIdRef.current

    setState((current) => ({ ...current, isLoadingMore: true, loadMoreError: null }))

    void (async () => {
      try {
        const page = await listMyPlaylists(getAccessToken, nextPageToken)

        if (requestIdRef.current !== requestId) return

        setState((current) => ({
          ...current,
          playlists: appendPlaylistPage(current.playlists, page),
          nextPageToken: page.nextPageToken,
          // The library can have grown or shrunk since the first page.
          totalResults: page.totalResults > 0 ? page.totalResults : current.totalResults,
          isLoadingMore: false,
          loadMoreError: null,
        }))
      } catch (cause) {
        if (requestIdRef.current !== requestId) return

        // `playlists` and `nextPageToken` are deliberately untouched: retrying
        // resumes from the same cursor instead of restarting the library.
        setState((current) => ({ ...current, isLoadingMore: false, loadMoreError: toErrorCode(cause) }))
      } finally {
        // Only the current generation releases the guard. A continuation that a
        // refresh superseded must not clear a flag a *newer* continuation set —
        // the refresh already cleared it on its own way through.
        if (requestIdRef.current === requestId) {
          loadMoreInFlightRef.current = false
        }
      }
    })()
  }, [status, nextPageToken, getAccessToken])

  const refresh = useCallback(() => {
    hasStartedRef.current = true
    void retrieveFirstPage()
  }, [retrieveFirstPage])

  // A different account must never see the previous account's playlists, and
  // signing out must not leave them in memory.
  const userId = user?.id ?? null
  const previousUserIdRef = useRef(userId)

  useEffect(() => {
    if (previousUserIdRef.current === userId) return

    previousUserIdRef.current = userId
    // Abandons any in-flight response along with the discarded state.
    requestIdRef.current += 1
    hasStartedRef.current = false
    loadMoreInFlightRef.current = false

    setState(INITIAL_STATE)
  }, [userId])

  const value = useMemo<IPlaylistLibrary>(
    () => ({
      playlists: state.playlists,
      status: state.status,
      error: state.error,
      isLoadingMore: state.isLoadingMore,
      loadMoreError: state.loadMoreError,
      hasMore: state.nextPageToken !== undefined,
      totalResults: state.totalResults,
      loadFirstPage,
      loadMore,
      refresh,
    }),
    [state, loadFirstPage, loadMore, refresh],
  )

  return <PlaylistLibraryContext.Provider value={value}>{children}</PlaylistLibraryContext.Provider>
}
