import { useEffect, useState } from 'react'

import {
  getVideoDurations,
  listMyPlaylists,
  listPlaylistVideos,
} from '@/api/youtube/resources'
import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { useAuth } from '@/hooks/use-auth'
import type { IVideo, LoadStatus } from '@/models/copy.interface'
import type {
  IInsightsPlaylistScan,
  IInsightsProgress,
  IInsightsReport,
} from '@/models/insights.interface'

import { buildInsightsReport, parseIsoDurationSeconds } from './insights.utils'

interface ILoadState {
  status: LoadStatus
  error: YouTubeErrorCode | null
}

const READY_STATE: ILoadState = { status: 'ready', error: null }

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

function shouldAbortLibraryScan(cause: unknown): boolean {
  return (
    cause instanceof YouTubeError &&
    (cause.code === 'quotaExceeded' ||
      cause.code === 'authExpired' ||
      cause.code === 'network')
  )
}

export function useLibraryInsights() {
  const auth = useAuth()
  const [loadState, setLoadState] = useState<ILoadState>({
    status: 'idle',
    error: null,
  })
  const [progress, setProgress] = useState<IInsightsProgress | null>(null)
  const [report, setReport] = useState<IInsightsReport | null>(null)
  const [scanNonce, setScanNonce] = useState(0)

  useEffect(() => {
    if (!auth.isAuthenticated) return

    const controller = new AbortController()

    const scanLibrary = async (): Promise<void> => {
      setLoadState({ status: 'loading', error: null })
      setProgress({ phase: 'playlists', completed: 0, total: 1 })
      setReport(null)

      try {
        const playlists = await listMyPlaylists(
          auth.getAccessToken,
          controller.signal,
        )

        const videos: IVideo[] = []
        const scans: IInsightsPlaylistScan[] = []

        setProgress({
          phase: 'videos',
          completed: 0,
          total: Math.max(playlists.length, 1),
        })

        for (const [index, playlist] of playlists.entries()) {
          try {
            const playlistVideos = await listPlaylistVideos(
              auth.getAccessToken,
              playlist.id,
              controller.signal,
            )

            videos.push(...playlistVideos)
            scans.push({
              playlist,
              itemCount: playlistVideos.length,
              failed: false,
            })
          } catch (cause) {
            if (controller.signal.aborted) return
            if (shouldAbortLibraryScan(cause)) throw cause

            scans.push({
              playlist,
              itemCount: playlist.itemCount,
              failed: true,
            })
          }

          if (controller.signal.aborted) return

          setProgress({
            phase: 'videos',
            completed: index + 1,
            total: playlists.length,
          })
        }

        const uniqueAvailableIds = [
          ...new Set(
            videos
              .filter((video) => !video.isUnavailable)
              .map((video) => video.videoId),
          ),
        ]

        setProgress({
          phase: 'durations',
          completed: 0,
          total: Math.max(uniqueAvailableIds.length, 1),
        })

        const durations =
          uniqueAvailableIds.length > 0
            ? await getVideoDurations(
                auth.getAccessToken,
                uniqueAvailableIds,
                controller.signal,
              )
            : []

        if (controller.signal.aborted) return

        const durationSecondsByVideoId = new Map<string, number>()

        for (const duration of durations) {
          const seconds = parseIsoDurationSeconds(duration.isoDuration)

          if (seconds === null || seconds <= 0) continue

          durationSecondsByVideoId.set(duration.videoId, seconds)
        }

        setProgress({
          phase: 'durations',
          completed: uniqueAvailableIds.length,
          total: Math.max(uniqueAvailableIds.length, 1),
        })
        setReport(
          buildInsightsReport({
            videos,
            scans,
            durationSecondsByVideoId,
            currentYear: new Date().getFullYear(),
          }),
        )
        setLoadState(READY_STATE)
      } catch (cause) {
        if (controller.signal.aborted) return

        setLoadState({ status: 'failed', error: toErrorCode(cause) })
        setProgress(null)
      }
    }

    void scanLibrary()

    return () => controller.abort()
  }, [auth.getAccessToken, auth.isAuthenticated, scanNonce])

  return {
    auth,
    loadState,
    progress,
    report,
    retry: () => setScanNonce((current) => current + 1),
  }
}
