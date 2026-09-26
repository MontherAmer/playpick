import { useEffect, useRef, useState } from 'react'

import {
  getMyChannelId,
  getVideoDetails,
  listMyPlaylists,
  listPlaylistVideos,
  type IVideoDetails,
} from '@/api/youtube/resources'
import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { useAuth } from '@/hooks/use-auth'
import type { IPlaylist, IVideo, LoadStatus } from '@/models/copy.interface'
import type { IRenamePattern, RenamePresetId } from '@/models/rename.interface'

import { DEFAULT_RENAME_PATTERN, RENAME_PRESETS } from './rename.constants'
import { buildRenamePlan, buildRenamePreview } from './rename.utils'
import { useRenameSave } from './use-rename-save'

interface ILoadState {
  status: LoadStatus
  error: YouTubeErrorCode | null
}

const IDLE_STATE: ILoadState = { status: 'idle', error: null }
const READY_STATE: ILoadState = { status: 'ready', error: null }

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

export function useRenamePlaylist() {
  const auth = useAuth()
  const save = useRenameSave()
  const [playlists, setPlaylists] = useState<IPlaylist[]>([])
  const [libraryState, setLibraryState] = useState<ILoadState>(IDLE_STATE)
  const [playlist, setPlaylist] = useState<IPlaylist | null>(null)
  const [videos, setVideos] = useState<IVideo[]>([])
  const [loadState, setLoadState] = useState<ILoadState>(IDLE_STATE)
  const [channelId, setChannelId] = useState<string | null>(null)
  const [detailsByVideoId, setDetailsByVideoId] = useState<
    Map<string, IVideoDetails>
  >(new Map())
  const [pattern, setPattern] = useState<IRenamePattern>(DEFAULT_RENAME_PATTERN)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const pendingPlaylistRef = useRef<IPlaylist | null>(null)

  useEffect(() => {
    if (!auth.isAuthenticated) return

    const controller = new AbortController()

    const loadLibrary = async (): Promise<void> => {
      setLibraryState({ status: 'loading', error: null })

      try {
        const [nextPlaylists, nextChannelId] = await Promise.all([
          listMyPlaylists(auth.getAccessToken, controller.signal),
          getMyChannelId(auth.getAccessToken, controller.signal),
        ])
        setPlaylists(nextPlaylists)
        setChannelId(nextChannelId)
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

  const previewRows = buildRenamePreview({
    videos,
    pattern,
    channelId,
    detailsByVideoId,
  })
  const plan = buildRenamePlan({ rows: previewRows, detailsByVideoId })
  const ownedCount = previewRows.filter((row) => row.isOwned).length
  const labelOnlyCount = previewRows.filter(
    (row) => !row.isOwned && !row.video.isUnavailable,
  ).length

  useEffect(() => {
    if (plan.length === 0) return

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [plan.length])

  const loadPlaylist = async (nextPlaylist: IPlaylist): Promise<void> => {
    setPlaylist(nextPlaylist)
    setVideos([])
    setDetailsByVideoId(new Map())
    setLoadState({ status: 'loading', error: null })
    save.reset()

    try {
      const nextVideos = await listPlaylistVideos(
        auth.getAccessToken,
        nextPlaylist.id,
      )
      const details = await getVideoDetails(
        auth.getAccessToken,
        nextVideos.map((video) => video.videoId),
      )
      setVideos(nextVideos)
      setDetailsByVideoId(
        new Map(details.map((video) => [video.videoId, video])),
      )
      setLoadState(READY_STATE)
    } catch (cause) {
      setLoadState({ status: 'failed', error: toErrorCode(cause) })
    }
  }

  const handlePlaylistChange = (playlistId: string): void => {
    const nextPlaylist = playlists.find((candidate) => candidate.id === playlistId)

    if (!nextPlaylist || nextPlaylist.id === playlist?.id) return

    if (plan.length > 0) {
      pendingPlaylistRef.current = nextPlaylist
      setIsDiscardDialogOpen(true)
      return
    }

    void loadPlaylist(nextPlaylist)
  }

  const updatePattern = <TField extends keyof IRenamePattern>(
    field: TField,
    value: IRenamePattern[TField],
  ): void => {
    setPattern((current) => ({ ...current, [field]: value }))
  }

  const applyPreset = (presetId: RenamePresetId): void => {
    setPattern(RENAME_PRESETS[presetId])
  }

  const handleConfirmDiscard = (): void => {
    setPattern(DEFAULT_RENAME_PATTERN)
    setIsDiscardDialogOpen(false)
    const nextPlaylist = pendingPlaylistRef.current
    pendingPlaylistRef.current = null

    if (nextPlaylist) void loadPlaylist(nextPlaylist)
  }

  const handleStartOver = (): void => {
    save.reset()
    setPlaylist(null)
    setVideos([])
    setDetailsByVideoId(new Map())
    setLoadState(IDLE_STATE)
    setPattern(DEFAULT_RENAME_PATTERN)
  }

  return {
    auth,
    playlists,
    libraryState,
    playlist,
    videos,
    loadState,
    pattern,
    previewRows,
    plan,
    pendingCount: plan.length,
    ownedCount,
    labelOnlyCount,
    save,
    isDiscardDialogOpen,
    handlePlaylistChange,
    retry: () => {
      if (playlist) void loadPlaylist(playlist)
    },
    updatePattern,
    applyPreset,
    handleSave: () => void save.save(plan),
    handleConfirmDiscard,
    handleStartOver,
    openDiscardDialog: () => setIsDiscardDialogOpen(true),
    closeDiscardDialog: () => {
      pendingPlaylistRef.current = null
      setIsDiscardDialogOpen(false)
    },
    handleCloseSaveError: () => {
      if (playlist) void loadPlaylist(playlist)
      else save.reset()
    },
  }
}
