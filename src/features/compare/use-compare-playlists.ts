import { useEffect, useRef, useState } from 'react'

import { listMyPlaylists, listPlaylistVideos } from '@/api/youtube/resources'
import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { useAuth } from '@/hooks/use-auth'
import type {
  CompareCopyDirection,
  CompareFilter,
  CompareSide,
  ICompareCopyRequest,
} from '@/models/compare.interface'
import type { IPlaylist, IVideo, LoadStatus } from '@/models/copy.interface'

import {
  buildCompareCopyPlan,
  buildCompareRows,
  buildCompareSummary,
  filterCompareRows,
  getCopyableRows,
} from './compare.utils'
import { useCompareSave } from './use-compare-save'

interface ILoadState {
  status: LoadStatus
  error: YouTubeErrorCode | null
}

const IDLE_STATE: ILoadState = { status: 'idle', error: null }
const READY_STATE: ILoadState = { status: 'ready', error: null }

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

export function useComparePlaylists() {
  const auth = useAuth()
  const save = useCompareSave()
  const [playlists, setPlaylists] = useState<IPlaylist[]>([])
  const [libraryState, setLibraryState] = useState<ILoadState>(IDLE_STATE)
  const [playlistA, setPlaylistA] = useState<IPlaylist | null>(null)
  const [playlistB, setPlaylistB] = useState<IPlaylist | null>(null)
  const [videosA, setVideosA] = useState<IVideo[]>([])
  const [videosB, setVideosB] = useState<IVideo[]>([])
  const [stateA, setStateA] = useState<ILoadState>(IDLE_STATE)
  const [stateB, setStateB] = useState<ILoadState>(IDLE_STATE)
  const [filter, setFilter] = useState<CompareFilter>('both')
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set())
  const [pendingCopy, setPendingCopy] = useState<ICompareCopyRequest | null>(null)
  const loadControllersRef = useRef<Partial<Record<CompareSide, AbortController>>>({})

  useEffect(() => {
    if (!auth.isAuthenticated) return

    const controller = new AbortController()

    const loadLibrary = async (): Promise<void> => {
      setLibraryState({ status: 'loading', error: null })

      try {
        setPlaylists(await listMyPlaylists(auth.getAccessToken, controller.signal))
        setLibraryState(READY_STATE)
      } catch (cause) {
        if (!controller.signal.aborted) {
          setLibraryState({ status: 'failed', error: toErrorCode(cause) })
        }
      }
    }

    void loadLibrary()

    return () => controller.abort()
  }, [auth.getAccessToken, auth.isAuthenticated])

  useEffect(() => {
    if (save.status !== 'saving') return

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [save.status])

  const rows = buildCompareRows(
    stateA.status === 'ready' ? videosA : [],
    stateB.status === 'ready' ? videosB : [],
  )
  const summary = buildCompareSummary(rows)
  const visibleRows = filterCompareRows(rows, filter)
  const copyableToA = getCopyableRows({
    rows,
    filter,
    selectedVideoIds,
    direction: 'toA',
  })
  const copyableToB = getCopyableRows({
    rows,
    filter,
    selectedVideoIds,
    direction: 'toB',
  })
  const isReady = stateA.status === 'ready' && stateB.status === 'ready'
  const selectableVisibleIds = visibleRows
    .filter((row) => !row.video.isUnavailable)
    .map((row) => row.video.videoId)
  const allVisibleSelected =
    selectableVisibleIds.length > 0 &&
    selectableVisibleIds.every((videoId) => selectedVideoIds.has(videoId))

  const loadSide = async (side: CompareSide, playlist: IPlaylist): Promise<void> => {
    loadControllersRef.current[side]?.abort()
    const controller = new AbortController()
    loadControllersRef.current[side] = controller

    if (side === 'a') {
      setPlaylistA(playlist)
      setVideosA([])
      setStateA({ status: 'loading', error: null })
    } else {
      setPlaylistB(playlist)
      setVideosB([])
      setStateB({ status: 'loading', error: null })
    }

    try {
      const videos = await listPlaylistVideos(
        auth.getAccessToken,
        playlist.id,
        controller.signal,
      )

      if (controller.signal.aborted) return

      if (side === 'a') {
        setVideosA(videos)
        setStateA(READY_STATE)
      } else {
        setVideosB(videos)
        setStateB(READY_STATE)
      }
    } catch (cause) {
      if (controller.signal.aborted) return

      if (side === 'a') {
        setStateA({ status: 'failed', error: toErrorCode(cause) })
      } else {
        setStateB({ status: 'failed', error: toErrorCode(cause) })
      }
    }
  }

  const handlePlaylistChange = (side: CompareSide, playlistId: string): void => {
    const playlist = playlists.find((candidate) => candidate.id === playlistId)

    if (!playlist) return

    setSelectedVideoIds(new Set())
    setPendingCopy(null)

    if (side === 'a' && playlistB?.id === playlist.id) {
      loadControllersRef.current.b?.abort()
      setPlaylistB(null)
      setVideosB([])
      setStateB(IDLE_STATE)
    }

    if (side === 'b' && playlistA?.id === playlist.id) {
      loadControllersRef.current.a?.abort()
      setPlaylistA(null)
      setVideosA([])
      setStateA(IDLE_STATE)
    }

    void loadSide(side, playlist)
  }

  const handleToggleVideo = (videoId: string): void => {
    setSelectedVideoIds((current) => {
      const next = new Set(current)

      if (next.has(videoId)) next.delete(videoId)
      else next.add(videoId)

      return next
    })
  }

  const handleToggleAllVisible = (): void => {
    setSelectedVideoIds((current) => {
      const next = new Set(current)

      if (allVisibleSelected) {
        selectableVisibleIds.forEach((videoId) => next.delete(videoId))
      } else {
        selectableVisibleIds.forEach((videoId) => next.add(videoId))
      }

      return next
    })
  }

  const handleRequestCopy = (direction: CompareCopyDirection): void => {
    const destination = direction === 'toA' ? playlistA : playlistB
    const copyable = direction === 'toA' ? copyableToA : copyableToB

    if (!destination || copyable.length === 0) return

    setPendingCopy({
      direction,
      destination,
      videos: copyable.map((row) => row.video),
    })
  }

  const refreshDestination = async (request: ICompareCopyRequest): Promise<void> => {
    await loadSide(request.direction === 'toA' ? 'a' : 'b', request.destination)
    setSelectedVideoIds(new Set())
  }

  const handleConfirmCopy = (): void => {
    if (!pendingCopy) return

    const request = pendingCopy
    setPendingCopy(null)

    const copy = async (): Promise<void> => {
      const succeeded = await save.save(
        request.destination.id,
        buildCompareCopyPlan(request.videos),
      )

      await refreshDestination(request)

      if (succeeded) save.reset()
    }

    void copy()
  }

  const handleCloseSaveError = (): void => {
    save.reset()
  }

  return {
    auth,
    playlists,
    libraryState,
    playlistA,
    playlistB,
    stateA,
    stateB,
    filter,
    selectedVideoIds,
    pendingCopy,
    summary,
    visibleRows,
    copyableToA,
    copyableToB,
    isReady,
    allVisibleSelected,
    save,
    setFilter,
    handlePlaylistAChange: (playlistId: string) => handlePlaylistChange('a', playlistId),
    handlePlaylistBChange: (playlistId: string) => handlePlaylistChange('b', playlistId),
    retryPlaylistA: () => (playlistA ? void loadSide('a', playlistA) : undefined),
    retryPlaylistB: () => (playlistB ? void loadSide('b', playlistB) : undefined),
    handleToggleVideo,
    handleToggleAllVisible,
    handleRequestCopy,
    handleConfirmCopy,
    closeConfirmDialog: () => setPendingCopy(null),
    handleCloseSaveError,
  }
}
