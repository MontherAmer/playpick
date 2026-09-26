import { useCallback, useRef, useState } from 'react'

import { updatePlaylistVideoPosition } from '@/api/youtube/resources'
import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { useAuth } from '@/hooks/use-auth'
import type { ISaveProgress, IVideo } from '@/models/copy.interface'
import type { IReorderMove } from '@/models/reorder.interface'

const INITIAL_PROGRESS: ISaveProgress = {
  status: 'idle',
  completed: 0,
  total: 0,
  error: null,
}

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

export function useReorderSave(playlistId?: string) {
  const { getAccessToken } = useAuth()
  const [progress, setProgress] = useState<ISaveProgress>(INITIAL_PROGRESS)
  const remainingRef = useRef<IReorderMove[]>([])
  const videosRef = useRef<IVideo[]>([])
  const inFlightRef = useRef(false)

  const run = useCallback(
    async (
      moves: readonly IReorderMove[],
      completedBeforeRun: number,
      total: number,
    ): Promise<boolean> => {
      if (!playlistId || inFlightRef.current || moves.length === 0) return false

      inFlightRef.current = true
      const videoIdByItemId = new Map(
        videosRef.current.map((video) => [video.id, video.videoId]),
      )
      let completed = completedBeforeRun
      let remaining = [...moves]
      remainingRef.current = remaining
      setProgress({ status: 'saving', completed, total, error: null })

      for (const move of moves) {
        const videoId = videoIdByItemId.get(move.playlistItemId)

        if (!videoId) {
          setProgress({ status: 'failed', completed, total, error: 'notFound' })
          inFlightRef.current = false
          return false
        }

        try {
          await updatePlaylistVideoPosition(getAccessToken, {
            playlistItemId: move.playlistItemId,
            playlistId,
            videoId,
            position: move.toPosition,
          })
        } catch (cause) {
          remainingRef.current = remaining
          setProgress({
            status: 'failed',
            completed,
            total,
            error: toErrorCode(cause),
          })
          inFlightRef.current = false

          return false
        }

        completed += 1
        remaining = remaining.slice(1)
        remainingRef.current = remaining
        setProgress({ status: 'saving', completed, total, error: null })
      }

      remainingRef.current = []
      setProgress({ status: 'succeeded', completed, total, error: null })
      inFlightRef.current = false

      return true
    },
    [getAccessToken, playlistId],
  )

  const save = useCallback(
    (moves: readonly IReorderMove[], videos: readonly IVideo[]): Promise<boolean> => {
      videosRef.current = [...videos]
      return run(moves, 0, moves.length)
    },
    [run],
  )

  const retry = useCallback(
    (): Promise<boolean> =>
      run(remainingRef.current, progress.completed, progress.total),
    [progress.completed, progress.total, run],
  )

  const reset = useCallback((): void => {
    remainingRef.current = []
    videosRef.current = []
    inFlightRef.current = false
    setProgress(INITIAL_PROGRESS)
  }, [])

  return { ...progress, save, retry, reset }
}
