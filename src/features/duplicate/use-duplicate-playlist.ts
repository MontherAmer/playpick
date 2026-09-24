import { useEffect, useRef, useState } from 'react'

import { useTranslation } from 'react-i18next'

import { listMyPlaylists, listPlaylistVideos } from '@/api/youtube/resources'
import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { useBuildSave } from '@/features/build/use-build-save'
import { useAuth } from '@/hooks/use-auth'
import type { IPlaylistDraft } from '@/models/build.interface'
import type { IPlaylist, IVideo, LoadStatus, PlaylistPrivacy } from '@/models/copy.interface'

import { buildDuplicatePlan } from './duplicate.utils'

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

export function useDuplicatePlaylist() {
  const { t } = useTranslation()
  const auth = useAuth()
  const save = useBuildSave()
  const [playlists, setPlaylists] = useState<IPlaylist[]>([])
  const [libraryState, setLibraryState] = useState<ILoadState>(IDLE_STATE)
  const [sourcePlaylist, setSourcePlaylist] = useState<IPlaylist | null>(null)
  const [sourceVideos, setSourceVideos] = useState<IVideo[]>([])
  const [sourceState, setSourceState] = useState<ILoadState>(IDLE_STATE)
  const [playlistDraft, setPlaylistDraft] = useState<IPlaylistDraft>(EMPTY_PLAYLIST)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const lastSuggestedTitleRef = useRef('')

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

  const plan = buildDuplicatePlan(sourceVideos)
  const canDuplicate =
    sourcePlaylist !== null &&
    sourceState.status === 'ready' &&
    plan.copyableCount > 0 &&
    playlistDraft.title.trim().length > 0

  const loadSource = async (playlist: IPlaylist): Promise<void> => {
    setSourcePlaylist(playlist)
    setSourceVideos([])
    setSourceState({ status: 'loading', error: null })
    save.reset()

    const suggestedTitle = t('duplicate.nameSuggestion', { name: playlist.title })

    setPlaylistDraft((current) => ({
      ...current,
      title:
        current.title === '' || current.title === lastSuggestedTitleRef.current
          ? suggestedTitle
          : current.title,
      description: current.description === '' ? playlist.description ?? '' : current.description,
    }))
    lastSuggestedTitleRef.current = suggestedTitle

    try {
      setSourceVideos(await listPlaylistVideos(auth.getAccessToken, playlist.id))
      setSourceState(READY_STATE)
    } catch (cause) {
      setSourceState({ status: 'failed', error: toErrorCode(cause) })
    }
  }

  const handleSourceChange = (playlistId: string): void => {
    const playlist = playlists.find((candidate) => candidate.id === playlistId)

    if (playlist) void loadSource(playlist)
  }

  const updatePlaylistDraft = (
    field: keyof IPlaylistDraft,
    value: string | PlaylistPrivacy,
  ): void => {
    setPlaylistDraft((current) => ({ ...current, [field]: value }))
  }

  const handleConfirmDuplicate = (): void => {
    setIsConfirmDialogOpen(false)
    void save.save(plan.steps, playlistDraft)
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
    setSourcePlaylist(null)
    setSourceVideos([])
    setSourceState(IDLE_STATE)
    setPlaylistDraft(EMPTY_PLAYLIST)
    lastSuggestedTitleRef.current = ''
  }

  return {
    auth,
    playlists,
    libraryState,
    sourcePlaylist,
    sourceVideos,
    sourceState,
    playlistDraft,
    plan,
    canDuplicate,
    save,
    isConfirmDialogOpen,
    handleSourceChange,
    retrySource: () => {
      if (sourcePlaylist) void loadSource(sourcePlaylist)
    },
    updatePlaylistDraft,
    handleConfirmDuplicate,
    handleStartOver,
    openConfirmDialog: () => setIsConfirmDialogOpen(true),
    closeConfirmDialog: () => setIsConfirmDialogOpen(false),
  }
}
