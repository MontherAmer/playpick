import { useEffect, useRef, useState } from 'react'

import {
  getPlaylist,
  getVideos,
  listMyPlaylists,
  listPlaylistVideos,
  searchVideos,
} from '@/api/youtube/resources'
import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { useAuth } from '@/hooks/use-auth'
import type {
  CopySourceMode,
  IPlaylist,
  IPendingCopy,
  IVideo,
  LoadStatus,
} from '@/models/copy.interface'

import { buildCopyPlan, createPendingCopies, parsePlaylistId, parseVideoIds } from './copy.utils'
import { useCopySave } from './use-copy-save'

interface ILoadState {
  status: LoadStatus
  error: YouTubeErrorCode | null
}

const READY_STATE: ILoadState = { status: 'ready', error: null }
const IDLE_STATE: ILoadState = { status: 'idle', error: null }

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

export function useCopyVideos() {
  const auth = useAuth()
  const [playlists, setPlaylists] = useState<IPlaylist[]>([])
  const [libraryState, setLibraryState] = useState<ILoadState>(IDLE_STATE)
  const [sourceMode, setSourceMode] = useState<CopySourceMode>('mine')
  const [sourcePlaylist, setSourcePlaylist] = useState<IPlaylist | null>(null)
  const [destinationPlaylist, setDestinationPlaylist] = useState<IPlaylist | null>(null)
  const [sourceVideos, setSourceVideos] = useState<IVideo[]>([])
  const [destinationVideos, setDestinationVideos] = useState<IVideo[]>([])
  const [sourceState, setSourceState] = useState<ILoadState>(IDLE_STATE)
  const [destinationState, setDestinationState] = useState<ILoadState>(IDLE_STATE)
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set())
  const [sourceFilter, setSourceFilter] = useState('')
  const [sourceInput, setSourceInput] = useState('')
  const [pending, setPending] = useState<IPendingCopy[]>([])
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [includeDuplicates, setIncludeDuplicates] = useState(false)
  const pendingChangeRef = useRef<(() => void) | null>(null)
  const save = useCopySave(destinationPlaylist?.id)

  useEffect(() => {
    if (!auth.isAuthenticated) return

    const controller = new AbortController()

    const loadLibrary = async (): Promise<void> => {
      setLibraryState({ status: 'loading', error: null })

      try {
        setPlaylists(await listMyPlaylists(auth.getAccessToken, controller.signal))
        setLibraryState(READY_STATE)
      } catch (cause) {
        if (controller.signal.aborted) return
        setLibraryState({ status: 'failed', error: toErrorCode(cause) })
      }
    }

    void loadLibrary()

    return () => {
      controller.abort()
    }
  }, [auth.getAccessToken, auth.isAuthenticated])

  useEffect(() => {
    if (pending.length === 0) return

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pending.length])

  const filteredSourceVideos = sourceVideos.filter((video) =>
    video.title.toLocaleLowerCase().includes(sourceFilter.trim().toLocaleLowerCase()),
  )
  const duplicateCount = pending.filter((copy) => copy.isDuplicate).length
  const copyPlan = buildCopyPlan(pending, includeDuplicates)

  const resetDraft = (): void => {
    setPending([])
    setSelectedVideoIds(new Set())
    setIncludeDuplicates(false)
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

  const handleSourceModeChange = (mode: CopySourceMode): void => {
    if (mode === sourceMode) return

    requestDraftReset(() => {
      setSourceMode(mode)
      setSourcePlaylist(null)
      setSourceVideos([])
      setSourceInput('')
      setSourceFilter('')
      setSourceState(IDLE_STATE)
      setSelectedVideoIds(new Set())
    })
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

  const loadExternalSource = async (): Promise<void> => {
    setSourceState({ status: 'loading', error: null })
    setSourceVideos([])
    setSelectedVideoIds(new Set())

    try {
      if (sourceMode === 'playlist') {
        const playlistId = parsePlaylistId(sourceInput)

        if (!playlistId) throw new YouTubeError('notFound')

        const playlist = await getPlaylist(auth.getAccessToken, playlistId)
        setSourcePlaylist(playlist)
        setSourceVideos(await listPlaylistVideos(auth.getAccessToken, playlistId))
      } else if (sourceMode === 'search') {
        if (!sourceInput.trim()) return
        setSourcePlaylist(null)
        setSourceVideos(await searchVideos(auth.getAccessToken, sourceInput.trim()))
      } else if (sourceMode === 'paste') {
        const videoIds = parseVideoIds(sourceInput)

        if (videoIds.length === 0) throw new YouTubeError('notFound')

        setSourcePlaylist(null)
        setSourceVideos(await getVideos(auth.getAccessToken, videoIds))
      }

      setSourceState(READY_STATE)
    } catch (cause) {
      setSourceState({ status: 'failed', error: toErrorCode(cause) })
    }
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

  const handleRemovePending = (key: string): void => {
    setPending((current) => current.filter((copy) => copy.key !== key))
  }

  const handleDiscard = (): void => {
    resetDraft()
    setIsDiscardDialogOpen(false)
    const pendingChange = pendingChangeRef.current
    pendingChangeRef.current = null
    pendingChange?.()
  }

  const executeSave = async (): Promise<void> => {
    setIsDuplicateDialogOpen(false)
    await save.save(buildCopyPlan(pending, includeDuplicates))
  }

  const handleRequestSave = (): void => {
    if (duplicateCount > 0) {
      setIsDuplicateDialogOpen(true)
      return
    }

    void executeSave()
  }

  const handleSaveAfterDuplicateChoice = (shouldIncludeDuplicates: boolean): void => {
    const plan = buildCopyPlan(pending, shouldIncludeDuplicates)
    setIncludeDuplicates(shouldIncludeDuplicates)
    setIsDuplicateDialogOpen(false)
    void save.save(plan)
  }

  const handleResetAfterSuccess = (): void => {
    resetDraft()

    if (destinationPlaylist) void loadDestinationPlaylist(destinationPlaylist)
  }

  return {
    auth,
    playlists,
    libraryState,
    sourceMode,
    sourcePlaylist,
    destinationPlaylist,
    sourceVideos: filteredSourceVideos,
    destinationVideos,
    sourceState,
    destinationState,
    selectedVideoIds,
    sourceFilter,
    sourceInput,
    pending,
    duplicateCount,
    pendingCount: copyPlan.length,
    isDiscardDialogOpen,
    isDuplicateDialogOpen,
    save,
    setSourceFilter,
    setSourceInput,
    handleSourceModeChange,
    handleSourcePlaylistChange,
    handleDestinationPlaylistChange,
    loadExternalSource,
    handleToggleVideo,
    handleToggleAllVisible,
    handleAddVideos,
    handleAddSelected,
    handleRemovePending,
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
