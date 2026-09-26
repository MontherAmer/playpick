import { useEffect, useState } from 'react'

import { getVideoDetails, listMyPlaylists, listPlaylistVideos } from '@/api/youtube/resources'
import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { useAuth } from '@/hooks/use-auth'
import type { CleanerKeepRule } from '@/models/cleaner.interface'
import type { IPlaylist, IVideo, LoadStatus } from '@/models/copy.interface'

import {
  buildCleanerPlan,
  buildCleanerSummary,
  collectIssueVideos,
  groupDuplicateVideos,
  markMissingVideos,
} from './cleaner.utils'
import { useCleanerSave } from './use-cleaner-save'

interface ILoadState {
  status: LoadStatus
  error: YouTubeErrorCode | null
}

const IDLE_STATE: ILoadState = { status: 'idle', error: null }
const READY_STATE: ILoadState = { status: 'ready', error: null }

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

export function usePlaylistCleaner() {
  const auth = useAuth()
  const save = useCleanerSave()
  const [playlists, setPlaylists] = useState<IPlaylist[]>([])
  const [libraryState, setLibraryState] = useState<ILoadState>(IDLE_STATE)
  const [playlist, setPlaylist] = useState<IPlaylist | null>(null)
  const [videos, setVideos] = useState<IVideo[]>([])
  const [loadState, setLoadState] = useState<ILoadState>(IDLE_STATE)
  const [keepRules, setKeepRules] = useState<Record<string, CleanerKeepRule>>({})
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(new Set())
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

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

  const groups = groupDuplicateVideos(videos)
  const issueVideos = collectIssueVideos(videos)
  const summary = buildCleanerSummary({ groups, videos })
  const plan = buildCleanerPlan({
    groups,
    keepRules,
    issueVideos,
    selectedIssueIds,
  })
  const allIssuesSelected =
    issueVideos.length > 0 &&
    issueVideos.every((video) => selectedIssueIds.has(video.id))

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
    setKeepRules({})
    setSelectedIssueIds(new Set())
    setLoadState({ status: 'loading', error: null })
    save.reset()

    try {
      const nextVideos = await listPlaylistVideos(auth.getAccessToken, nextPlaylist.id)
      const checkableVideoIds = [
        ...new Set(
          nextVideos
            .filter((video) => !video.isUnavailable)
            .map((video) => video.videoId),
        ),
      ]
      const details =
        checkableVideoIds.length > 0
          ? await getVideoDetails(auth.getAccessToken, checkableVideoIds)
          : []
      const scannedVideos = markMissingVideos(
        nextVideos,
        new Set(details.map((video) => video.videoId)),
      )

      setVideos(scannedVideos)
      setSelectedIssueIds(
        new Set(collectIssueVideos(scannedVideos).map((video) => video.id)),
      )
      setLoadState(READY_STATE)
    } catch (cause) {
      setLoadState({ status: 'failed', error: toErrorCode(cause) })
    }
  }

  const handlePlaylistChange = (playlistId: string): void => {
    const nextPlaylist = playlists.find((candidate) => candidate.id === playlistId)

    if (!nextPlaylist || nextPlaylist.id === playlist?.id) return

    void loadPlaylist(nextPlaylist)
  }

  const handleKeepRuleChange = (videoId: string, rule: CleanerKeepRule): void => {
    setKeepRules((current) => ({ ...current, [videoId]: rule }))
  }

  const handleToggleIssue = (playlistItemId: string): void => {
    setSelectedIssueIds((current) => {
      const next = new Set(current)

      if (next.has(playlistItemId)) next.delete(playlistItemId)
      else next.add(playlistItemId)

      return next
    })
  }

  const handleToggleAllIssues = (): void => {
    setSelectedIssueIds(
      allIssuesSelected ? new Set() : new Set(issueVideos.map((video) => video.id)),
    )
  }

  const handleStartOver = (): void => {
    save.reset()
    setPlaylist(null)
    setVideos([])
    setKeepRules({})
    setSelectedIssueIds(new Set())
    setLoadState(IDLE_STATE)
  }

  return {
    auth,
    playlists,
    libraryState,
    playlist,
    loadState,
    groups,
    issueVideos,
    summary,
    plan,
    keepRules,
    selectedIssueIds,
    allIssuesSelected,
    isClean:
      loadState.status === 'ready' &&
      groups.length === 0 &&
      issueVideos.length === 0,
    save,
    isConfirmDialogOpen,
    handlePlaylistChange,
    retry: () => {
      if (playlist) void loadPlaylist(playlist)
    },
    handleKeepRuleChange,
    handleToggleIssue,
    handleToggleAllIssues,
    handleConfirmClean: () => {
      setIsConfirmDialogOpen(false)
      void save.save(plan)
    },
    handleStartOver,
    openConfirmDialog: () => setIsConfirmDialogOpen(true),
    closeConfirmDialog: () => setIsConfirmDialogOpen(false),
    handleCloseSaveError: () => {
      if (playlist) void loadPlaylist(playlist)
      else save.reset()
    },
  }
}
