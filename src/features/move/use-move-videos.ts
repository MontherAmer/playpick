import { useEffect, useRef, useState } from 'react'

import { listMyPlaylists, listPlaylistVideos } from '@/api/youtube/resources'
import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { createPendingCopies } from '@/features/copy/copy.utils'
import { useAuth } from '@/hooks/use-auth'
import type {
  IPlaylist,
  IPendingCopy,
  IVideo,
  LoadStatus,
} from '@/models/copy.interface'

import { buildMovePlan } from './move.utils'
import { useMoveSave } from './use-move-save'

interface ILoadState {
  status: LoadStatus
  error: YouTubeErrorCode | null
}

const IDLE_STATE: ILoadState = { status: 'idle', error: null }
const READY_STATE: ILoadState = { status: 'ready', error: null }

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

export function useMoveVideos() {
  const auth = useAuth()
  const [playlists, setPlaylists] = useState<IPlaylist[]>([])
  const [libraryState, setLibraryState] = useState<ILoadState>(IDLE_STATE)
  const [sourcePlaylist, setSourcePlaylist] = useState<IPlaylist | null>(null)
  const [destinationPlaylist, setDestinationPlaylist] = useState<IPlaylist | null>(null)
  const [sourceVideos, setSourceVideos] = useState<IVideo[]>([])
  const [destinationVideos, setDestinationVideos] = useState<IVideo[]>([])
  const [sourceState, setSourceState] = useState<ILoadState>(IDLE_STATE)
  const [destinationState, setDestinationState] = useState<ILoadState>(IDLE_STATE)
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set())
  const [sourceFilter, setSourceFilter] = useState('')
  const [pending, setPending] = useState<IPendingCopy[]>([])
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const pendingChangeRef = useRef<(() => void) | null>(null)
  const save = useMoveSave(destinationPlaylist?.id)

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
    if (pending.length === 0) return

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pending.length])

  const filteredSourceVideos = sourceVideos.filter((video) =>
    video.title.toLocaleLowerCase().includes(sourceFilter.trim().toLocaleLowerCase()),
  )
  const duplicateCount = pending.filter((move) => move.isDuplicate).length
  const pendingCount = pending.length - duplicateCount

  const resetDraft = (): void => {
    setPending([])
    setSelectedVideoIds(new Set())
    save.reset()
  }

  const requestDraftReset = (change: () => void): void => {
    if (pending.length === 0) {
      change()
      return
    }

    pendingChangeRef.current = change
    setIsDiscardDialogOpen(true)
  }

  const loadSourcePlaylist = async (playlist: IPlaylist): Promise<void> => {
    setSourcePlaylist(playlist)
    setSourceVideos([])
    setSourceState({ status: 'loading', error: null })
    resetDraft()

    try {
      setSourceVideos(await listPlaylistVideos(auth.getAccessToken, playlist.id))
      setSourceState(READY_STATE)
    } catch (cause) {
      setSourceState({ status: 'failed', error: toErrorCode(cause) })
    }
  }

  const loadDestinationPlaylist = async (playlist: IPlaylist): Promise<void> => {
    if (playlist.id === sourcePlaylist?.id) return

    setDestinationPlaylist(playlist)
    setDestinationVideos([])
    setDestinationState({ status: 'loading', error: null })
    resetDraft()

    try {
      setDestinationVideos(await listPlaylistVideos(auth.getAccessToken, playlist.id))
      setDestinationState(READY_STATE)
    } catch (cause) {
      setDestinationState({ status: 'failed', error: toErrorCode(cause) })
    }
  }

  const handleSourcePlaylistChange = (playlistId: string): void => {
    const playlist = playlists.find((candidate) => candidate.id === playlistId)

    if (playlist && playlist.id !== destinationPlaylist?.id) {
      requestDraftReset(() => void loadSourcePlaylist(playlist))
    }
  }

  const handleDestinationPlaylistChange = (playlistId: string): void => {
    const playlist = playlists.find((candidate) => candidate.id === playlistId)

    if (playlist) requestDraftReset(() => void loadDestinationPlaylist(playlist))
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
      const visibleIds = filteredSourceVideos.map((video) => video.videoId)
      const areAllSelected = visibleIds.length > 0 && visibleIds.every((id) => next.has(id))

      visibleIds.forEach((id) => {
        if (areAllSelected) next.delete(id)
        else next.add(id)
      })

      return next
    })
  }

  const handleAddVideos = (videos: readonly IVideo[]): void => {
    if (!destinationPlaylist || destinationState.status !== 'ready') return

    setPending((current) => [
      ...current,
      ...createPendingCopies({
        videos,
        destinationVideos,
        currentPending: current,
      }),
    ])
  }

  const handleAddSelected = (): void => {
    handleAddVideos(sourceVideos.filter((video) => selectedVideoIds.has(video.videoId)))
    setSelectedVideoIds(new Set())
  }

  const handleDiscard = (): void => {
    resetDraft()
    setIsDiscardDialogOpen(false)
    const pendingChange = pendingChangeRef.current
    pendingChangeRef.current = null
    pendingChange?.()
  }

  const handleRequestSave = (): void => {
    if (duplicateCount > 0) {
      setIsDuplicateDialogOpen(true)
      return
    }

    void save.save(buildMovePlan(pending, false))
  }

  const handleSaveAfterDuplicateChoice = (includeDuplicates: boolean): void => {
    setIsDuplicateDialogOpen(false)
    void save.save(buildMovePlan(pending, includeDuplicates))
  }

  const handleResetAfterSuccess = (): void => {
    resetDraft()

    if (sourcePlaylist) void loadSourcePlaylist(sourcePlaylist)
    if (destinationPlaylist) void loadDestinationPlaylist(destinationPlaylist)
  }

  return {
    auth,
    playlists,
    libraryState,
    sourcePlaylist,
    destinationPlaylist,
    sourceVideos: filteredSourceVideos,
    destinationVideos,
    sourceState,
    destinationState,
    selectedVideoIds,
    sourceFilter,
    pending,
    duplicateCount,
    pendingCount,
    isDiscardDialogOpen,
    isDuplicateDialogOpen,
    save,
    setSourceFilter,
    handleSourcePlaylistChange,
    handleDestinationPlaylistChange,
    handleToggleVideo,
    handleToggleAllVisible,
    handleAddVideos,
    handleAddSelected,
    handleRemovePending: (key: string) =>
      setPending((current) => current.filter((move) => move.key !== key)),
    handleDiscard,
    handleRequestSave,
    handleSaveAfterDuplicateChoice,
    handleResetAfterSuccess,
    closeDiscardDialog: () => {
      pendingChangeRef.current = null
      setIsDiscardDialogOpen(false)
    },
    closeDuplicateDialog: () => setIsDuplicateDialogOpen(false),
    openDiscardDialog: () => setIsDiscardDialogOpen(true),
  }
}
