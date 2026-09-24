import { useEffect, useState } from 'react'

import { listMyPlaylists, listPlaylistVideos } from '@/api/youtube/resources'
import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { useBuildSave } from '@/features/build/use-build-save'
import { useAuth } from '@/hooks/use-auth'
import type { IBuildStep, IPlaylistDraft } from '@/models/build.interface'
import type { IPlaylist, IVideo, LoadStatus, PlaylistPrivacy } from '@/models/copy.interface'
import type {
  IMergeEntry,
  IMergeSource,
  MergeDestinationKind,
} from '@/models/merge.interface'

interface ISourceLoadState {
  status: LoadStatus
  error: YouTubeErrorCode | null
  videos: IVideo[]
}

const IDLE_STATE: ISourceLoadState = { status: 'idle', error: null, videos: [] }
const EMPTY_PLAYLIST: IPlaylistDraft = { title: '', description: '', privacy: 'private' }

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

function buildEntries({
  sources,
  destinationVideoIds,
}: {
  sources: readonly IMergeSource[]
  destinationVideoIds: ReadonlySet<string>
}): IMergeEntry[] {
  const seenVideoIds = new Set(destinationVideoIds)

  return sources.flatMap(({ playlist, videos }) =>
    videos
      .filter((video) => !video.isUnavailable)
      .map((video) => {
        const isDuplicate = seenVideoIds.has(video.videoId)
        seenVideoIds.add(video.videoId)

        return {
          key: `${playlist.id}-${video.id}`,
          sourcePlaylistId: playlist.id,
          sourcePlaylistTitle: playlist.title,
          video,
          isDuplicate,
        }
      }),
  )
}

export function useMergePlaylists() {
  const auth = useAuth()
  const save = useBuildSave()
  const [playlists, setPlaylists] = useState<IPlaylist[]>([])
  const [libraryState, setLibraryState] = useState<ISourceLoadState>(IDLE_STATE)
  const [selected, setSelected] = useState<IPlaylist[]>([])
  const [sourceStates, setSourceStates] = useState<Record<string, ISourceLoadState>>({})
  const [sourcePickerId, setSourcePickerId] = useState('')
  const [destinationKind, setDestinationKind] = useState<MergeDestinationKind>('new')
  const [destinationPlaylist, setDestinationPlaylist] = useState<IPlaylist | null>(null)
  const [destinationState, setDestinationState] = useState<ISourceLoadState>(IDLE_STATE)
  const [resultDraft, setResultDraft] = useState<IPlaylistDraft>(EMPTY_PLAYLIST)
  const [removeDuplicates, setRemoveDuplicates] = useState(true)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  useEffect(() => {
    if (!auth.isAuthenticated) return

    const controller = new AbortController()

    const loadLibrary = async (): Promise<void> => {
      setLibraryState({ status: 'loading', error: null, videos: [] })

      try {
        setPlaylists(await listMyPlaylists(auth.getAccessToken, controller.signal))
        setLibraryState({ status: 'ready', error: null, videos: [] })
      } catch (cause) {
        if (!controller.signal.aborted) {
          setLibraryState({ status: 'failed', error: toErrorCode(cause), videos: [] })
        }
      }
    }

    void loadLibrary()

    return () => controller.abort()
  }, [auth.getAccessToken, auth.isAuthenticated])

  useEffect(() => {
    if (selected.length === 0) return

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [selected.length])

  const sources: IMergeSource[] = selected
    .map((playlist) => {
      const state = sourceStates[playlist.id]

      return state?.status === 'ready' ? { playlist, videos: state.videos } : null
    })
    .filter((source): source is IMergeSource => source !== null)
  const destinationVideoIds = new Set(
    destinationKind === 'existing' && destinationState.status === 'ready'
      ? destinationState.videos.map((video) => video.videoId)
      : [],
  )
  const entries = buildEntries({ sources, destinationVideoIds })
  const plan: IBuildStep[] = entries
    .filter((entry) => !removeDuplicates || !entry.isDuplicate)
    .map((entry) => ({ key: entry.key, videoId: entry.video.videoId }))
  const duplicateCount = entries.filter((entry) => entry.isDuplicate).length
  const unavailableCount = sources.reduce(
    (total, source) => total + source.videos.filter((video) => video.isUnavailable).length,
    0,
  )
  const isLoadingSources = selected.some(
    (playlist) => sourceStates[playlist.id]?.status === 'loading',
  )
  const hasSourceError = selected.some(
    (playlist) => sourceStates[playlist.id]?.status === 'failed',
  )
  const isDestinationReady =
    destinationKind === 'new'
      ? resultDraft.title.trim().length > 0
      : destinationPlaylist !== null && destinationState.status === 'ready'
  const canMerge =
    selected.length >= 2 &&
    !isLoadingSources &&
    !hasSourceError &&
    isDestinationReady &&
    plan.length > 0

  const loadSource = async (playlist: IPlaylist): Promise<void> => {
    setSourceStates((current) => ({
      ...current,
      [playlist.id]: { status: 'loading', error: null, videos: [] },
    }))

    try {
      const videos = await listPlaylistVideos(auth.getAccessToken, playlist.id)
      setSourceStates((current) => ({
        ...current,
        [playlist.id]: { status: 'ready', error: null, videos },
      }))
    } catch (cause) {
      setSourceStates((current) => ({
        ...current,
        [playlist.id]: { status: 'failed', error: toErrorCode(cause), videos: [] },
      }))
    }
  }

  const handleAddSource = (): void => {
    const playlist = playlists.find((candidate) => candidate.id === sourcePickerId)

    if (!playlist || selected.some((candidate) => candidate.id === playlist.id)) return

    setSelected((current) => [...current, playlist])
    setSourcePickerId('')
    void loadSource(playlist)
  }

  const handleRemoveSource = (playlistId: string): void => {
    setSelected((current) => current.filter((playlist) => playlist.id !== playlistId))
  }

  const handleMoveSource = (fromIndex: number, toIndex: number): void => {
    setSelected((current) => {
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

  const handleDestinationPlaylistChange = (playlistId: string): void => {
    const playlist = playlists.find((candidate) => candidate.id === playlistId)

    if (!playlist) return

    const load = async (): Promise<void> => {
      setDestinationPlaylist(playlist)
      setDestinationState({ status: 'loading', error: null, videos: [] })

      try {
        const videos = await listPlaylistVideos(auth.getAccessToken, playlist.id)
        setDestinationState({ status: 'ready', error: null, videos })
      } catch (cause) {
        setDestinationState({ status: 'failed', error: toErrorCode(cause), videos: [] })
      }
    }

    void load()
  }

  const updateResultDraft = (
    field: keyof IPlaylistDraft,
    value: string | PlaylistPrivacy,
  ): void => {
    setResultDraft((current) => ({ ...current, [field]: value }))
  }

  const handleConfirmMerge = (): void => {
    setIsConfirmDialogOpen(false)

    if (destinationKind === 'existing' && destinationPlaylist) {
      void save.saveToExisting(plan, destinationPlaylist)
      return
    }

    void save.save(plan, resultDraft)
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
    setSelected([])
    setSourceStates({})
    setDestinationKind('new')
    setDestinationPlaylist(null)
    setDestinationState(IDLE_STATE)
    setResultDraft(EMPTY_PLAYLIST)
  }

  return {
    auth,
    playlists,
    libraryState,
    selected,
    sourceStates,
    sourcePickerId,
    destinationKind,
    destinationPlaylist,
    destinationState,
    resultDraft,
    removeDuplicates,
    entries,
    plan,
    duplicateCount,
    unavailableCount,
    isLoadingSources,
    hasSourceError,
    canMerge,
    save,
    isConfirmDialogOpen,
    setSourcePickerId,
    handleAddSource,
    handleRemoveSource,
    handleMoveSource,
    setDestinationKind,
    handleDestinationPlaylistChange,
    updateResultDraft,
    setRemoveDuplicates,
    handleConfirmMerge,
    handleStartOver,
    openConfirmDialog: () => setIsConfirmDialogOpen(true),
    closeConfirmDialog: () => setIsConfirmDialogOpen(false),
    retrySource: (playlist: IPlaylist) => void loadSource(playlist),
  }
}
