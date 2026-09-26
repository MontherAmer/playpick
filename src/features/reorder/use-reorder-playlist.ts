import { useEffect, useRef, useState } from 'react'

import { listMyPlaylists, listPlaylistVideos } from '@/api/youtube/resources'
import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { useAuth } from '@/hooks/use-auth'
import type { IPlaylist, IVideo, LoadStatus } from '@/models/copy.interface'

import { buildReorderPlan } from './reorder.utils'
import { useReorderSave } from './use-reorder-save'

interface ILoadState {
  status: LoadStatus
  error: YouTubeErrorCode | null
}

const IDLE_STATE: ILoadState = { status: 'idle', error: null }
const READY_STATE: ILoadState = { status: 'ready', error: null }

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

export function useReorderPlaylist() {
  const auth = useAuth()
  const [playlists, setPlaylists] = useState<IPlaylist[]>([])
  const [libraryState, setLibraryState] = useState<ILoadState>(IDLE_STATE)
  const [playlist, setPlaylist] = useState<IPlaylist | null>(null)
  const [loadState, setLoadState] = useState<ILoadState>(IDLE_STATE)
  const [original, setOriginal] = useState<IVideo[]>([])
  const [draft, setDraft] = useState<IVideo[]>([])
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const pendingPlaylistRef = useRef<IPlaylist | null>(null)
  const save = useReorderSave(playlist?.id)
  const movePlan = buildReorderPlan(original, draft)

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
    if (movePlan.length === 0) return

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [movePlan.length])

  const loadPlaylist = async (nextPlaylist: IPlaylist): Promise<void> => {
    setPlaylist(nextPlaylist)
    setOriginal([])
    setDraft([])
    setLoadState({ status: 'loading', error: null })
    save.reset()

    try {
      const videos = await listPlaylistVideos(auth.getAccessToken, nextPlaylist.id)
      setOriginal(videos)
      setDraft(videos)
      setLoadState(READY_STATE)
    } catch (cause) {
      setLoadState({ status: 'failed', error: toErrorCode(cause) })
    }
  }

  const handlePlaylistChange = (playlistId: string): void => {
    const nextPlaylist = playlists.find((candidate) => candidate.id === playlistId)

    if (!nextPlaylist || nextPlaylist.id === playlist?.id) return

    if (movePlan.length > 0) {
      pendingPlaylistRef.current = nextPlaylist
      setIsDiscardDialogOpen(true)
      return
    }

    void loadPlaylist(nextPlaylist)
  }

  const moveVideo = (fromIndex: number, toIndex: number): void => {
    setDraft((current) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        fromIndex >= current.length ||
        toIndex < 0 ||
        toIndex >= current.length
      ) {
        return current
      }

      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)

      if (!moved) return current

      next.splice(toIndex, 0, moved)
      return next
    })
  }

  const sortBy = (field: 'channel' | 'date' | 'title'): void => {
    setDraft((current) =>
      [...current].sort((first, second) => {
        const firstValue =
          field === 'channel'
            ? first.channelTitle ?? ''
            : field === 'date'
              ? first.dateAdded ?? ''
              : first.title
        const secondValue =
          field === 'channel'
            ? second.channelTitle ?? ''
            : field === 'date'
              ? second.dateAdded ?? ''
              : second.title

        return firstValue.localeCompare(secondValue)
      }),
    )
  }

  const shuffle = (): void => {
    setDraft((current) => {
      const next = [...current]

      for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1))
        const value = next[index]

        next[index] = next[swapIndex]
        next[swapIndex] = value
      }

      return next
    })
  }

  const handleSave = (): void => {
    void save.save(movePlan, draft).then((succeeded) => {
      if (succeeded) setOriginal(draft)
    })
  }

  const handleConfirmDiscard = (): void => {
    setDraft(original)
    setIsDiscardDialogOpen(false)
    const nextPlaylist = pendingPlaylistRef.current
    pendingPlaylistRef.current = null

    if (nextPlaylist) void loadPlaylist(nextPlaylist)
  }

  const handleStartOver = (): void => {
    save.reset()
    setPlaylist(null)
    setOriginal([])
    setDraft([])
    setLoadState(IDLE_STATE)
  }

  return {
    auth,
    playlists,
    libraryState,
    playlist,
    loadState,
    draft,
    movePlan,
    pendingCount: movePlan.length,
    save,
    isDiscardDialogOpen,
    handlePlaylistChange,
    retry: () => {
      if (playlist) void loadPlaylist(playlist)
    },
    moveVideo,
    sortBy,
    reverse: () => setDraft((current) => [...current].reverse()),
    shuffle,
    discard: () => setDraft(original),
    handleSave,
    handleCloseSaveError: () => {
      if (playlist) void loadPlaylist(playlist)
      else save.reset()
    },
    handleConfirmDiscard,
    handleStartOver,
    openDiscardDialog: () => setIsDiscardDialogOpen(true),
    closeDiscardDialog: () => {
      pendingPlaylistRef.current = null
      setIsDiscardDialogOpen(false)
    },
  }
}
