import { useEffect, useState } from 'react'

import {
  getPlaylist,
  getVideos,
  listMyPlaylists,
  listPlaylistVideos,
  searchVideos,
} from '@/api/youtube/resources'
import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { parsePlaylistId, parseVideoIds } from '@/features/copy/copy.utils'
import { useAuth } from '@/hooks/use-auth'
import type { BuildMode, IPlaylistDraft } from '@/models/build.interface'
import type {
  CopySourceMode,
  IPlaylist,
  IVideo,
  LoadStatus,
  PlaylistPrivacy,
} from '@/models/copy.interface'

import { useBuildDraft } from './use-build-draft'
import { useBuildSave } from './use-build-save'

interface ILoadState {
  status: LoadStatus
  error: YouTubeErrorCode | null
}

const IDLE_STATE: ILoadState = { status: 'idle', error: null }
const READY_STATE: ILoadState = { status: 'ready', error: null }
const EMPTY_PLAYLIST: IPlaylistDraft = { title: '', description: '', privacy: 'private' }

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

export function useBuildPlaylist() {
  const auth = useAuth()
  const draft = useBuildDraft()
  const save = useBuildSave()
  const [mode, setMode] = useState<BuildMode>('build')
  const [playlistDraft, setPlaylistDraft] = useState<IPlaylistDraft>(EMPTY_PLAYLIST)
  const [playlists, setPlaylists] = useState<IPlaylist[]>([])
  const [libraryState, setLibraryState] = useState<ILoadState>(IDLE_STATE)
  const [sourceMode, setSourceMode] = useState<CopySourceMode>('mine')
  const [sourcePlaylist, setSourcePlaylist] = useState<IPlaylist | null>(null)
  const [sourceVideos, setSourceVideos] = useState<IVideo[]>([])
  const [sourceState, setSourceState] = useState<ILoadState>(IDLE_STATE)
  const [sourceInput, setSourceInput] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set())
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)

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
    if (draft.entries.length === 0) return

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [draft.entries.length])

  const filteredSourceVideos = sourceVideos.filter((video) =>
    video.title.toLocaleLowerCase().includes(sourceFilter.trim().toLocaleLowerCase()),
  )
  const isPlaylistValid = playlistDraft.title.trim().length > 0
  const canSave = isPlaylistValid && (mode === 'empty' || draft.additionCount > 0)

  const updatePlaylistDraft = (
    field: keyof IPlaylistDraft,
    value: string | PlaylistPrivacy,
  ): void => {
    setPlaylistDraft((current) => ({ ...current, [field]: value }))
  }

  const handleSourceModeChange = (nextMode: CopySourceMode): void => {
    setSourceMode(nextMode)
    setSourcePlaylist(null)
    setSourceVideos([])
    setSourceState(IDLE_STATE)
    setSourceInput('')
    setSourceFilter('')
    setSelectedVideoIds(new Set())
  }

  const handleSourcePlaylistChange = (playlistId: string): void => {
    const playlist = playlists.find((candidate) => candidate.id === playlistId)

    if (!playlist) return

    const load = async (): Promise<void> => {
      setSourcePlaylist(playlist)
      setSourceVideos([])
      setSourceState({ status: 'loading', error: null })
      setSelectedVideoIds(new Set())

      try {
        setSourceVideos(await listPlaylistVideos(auth.getAccessToken, playlist.id))
        setSourceState(READY_STATE)
      } catch (cause) {
        setSourceState({ status: 'failed', error: toErrorCode(cause) })
      }
    }

    void load()
  }

  const loadExternalSource = async (): Promise<void> => {
    setSourceVideos([])
    setSourceState({ status: 'loading', error: null })
    setSelectedVideoIds(new Set())

    try {
      if (sourceMode === 'playlist') {
        const playlistId = parsePlaylistId(sourceInput)

        if (!playlistId) throw new YouTubeError('notFound')

        setSourcePlaylist(await getPlaylist(auth.getAccessToken, playlistId))
        setSourceVideos(await listPlaylistVideos(auth.getAccessToken, playlistId))
      } else if (sourceMode === 'search') {
        if (!sourceInput.trim()) {
          setSourceState(IDLE_STATE)
          return
        }

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
      const ids = filteredSourceVideos.map((video) => video.videoId)
      const allSelected = ids.length > 0 && ids.every((id) => next.has(id))

      ids.forEach((id) => {
        if (allSelected) next.delete(id)
        else next.add(id)
      })

      return next
    })
  }

  const handleAddSelected = (): void => {
    draft.addVideos(sourceVideos.filter((video) => selectedVideoIds.has(video.videoId)))
    setSelectedVideoIds(new Set())
  }

  const handleConfirmSave = (): void => {
    setIsConfirmDialogOpen(false)
    void save.save(mode === 'empty' ? [] : draft.plan, playlistDraft)
  }

  const handleStartOver = (): void => {
    const createdPlaylist = save.targetPlaylist

    if (createdPlaylist) {
      setPlaylists((current) =>
        current.some((playlist) => playlist.id === createdPlaylist.id)
          ? current
          : [createdPlaylist, ...current],
      )
    }

    save.reset()
    draft.discard()
    setPlaylistDraft(EMPTY_PLAYLIST)
  }

  return {
    auth,
    mode,
    playlistDraft,
    playlists,
    libraryState,
    sourceMode,
    sourcePlaylist,
    sourceVideos: filteredSourceVideos,
    sourceState,
    sourceInput,
    sourceFilter,
    selectedVideoIds,
    draft,
    save,
    canSave,
    isConfirmDialogOpen,
    isDiscardDialogOpen,
    setMode,
    updatePlaylistDraft,
    handleSourceModeChange,
    handleSourcePlaylistChange,
    setSourceInput,
    setSourceFilter,
    loadExternalSource,
    handleToggleVideo,
    handleToggleAllVisible,
    handleAddSelected,
    handleConfirmSave,
    handleStartOver,
    openConfirmDialog: () => setIsConfirmDialogOpen(true),
    closeConfirmDialog: () => setIsConfirmDialogOpen(false),
    openDiscardDialog: () => setIsDiscardDialogOpen(true),
    closeDiscardDialog: () => setIsDiscardDialogOpen(false),
    confirmDiscard: () => {
      draft.discard()
      setIsDiscardDialogOpen(false)
    },
  }
}
