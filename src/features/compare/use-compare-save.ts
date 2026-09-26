import { useCallback, useRef, useState } from 'react'

import { addPlaylistVideo } from '@/api/youtube/resources'
import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { useAuth } from '@/hooks/use-auth'
import type { ICopyStep, ISaveProgress } from '@/models/copy.interface'

const INITIAL_PROGRESS: ISaveProgress = {
  status: 'idle',
  completed: 0,
  total: 0,
  error: null,
}

interface IUseCompareSaveResult extends ISaveProgress {
  save: (playlistId: string, steps: readonly ICopyStep[]) => Promise<boolean>
  retry: () => Promise<boolean>
  reset: () => void
}

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

export function useCompareSave(): IUseCompareSaveResult {
  const { getAccessToken } = useAuth()
  const [progress, setProgress] = useState<ISaveProgress>(INITIAL_PROGRESS)
  const destinationIdRef = useRef<string | undefined>(undefined)
  const remainingRef = useRef<ICopyStep[]>([])
  const isSavingRef = useRef(false)

  const run = useCallback(
    async (
      playlistId: string,
      steps: readonly ICopyStep[],
      completedBeforeRun: number,
      total: number,
    ): Promise<boolean> => {
      if (isSavingRef.current || steps.length === 0) return false

      destinationIdRef.current = playlistId
      isSavingRef.current = true
      let completed = completedBeforeRun
      let remaining = [...steps]
      remainingRef.current = remaining
      setProgress({ status: 'saving', completed, total, error: null })

      for (const step of steps) {
        try {
          await addPlaylistVideo(getAccessToken, playlistId, step.videoId)
        } catch (cause) {
          remainingRef.current = remaining
          setProgress({
            status: 'failed',
            completed,
            total,
            error: toErrorCode(cause),
          })
          isSavingRef.current = false

          return false
        }

        completed += 1
        remaining = remaining.slice(1)
        remainingRef.current = remaining
        setProgress({ status: 'saving', completed, total, error: null })
      }

      remainingRef.current = []
      setProgress({ status: 'succeeded', completed, total, error: null })
      isSavingRef.current = false

      return true
    },
    [getAccessToken],
  )

  const save = useCallback(
    (playlistId: string, steps: readonly ICopyStep[]): Promise<boolean> =>
      run(playlistId, steps, 0, steps.length),
    [run],
  )

  const retry = useCallback((): Promise<boolean> => {
    const playlistId = destinationIdRef.current

    if (!playlistId) return Promise.resolve(false)

    return run(playlistId, remainingRef.current, progress.completed, progress.total)
  }, [progress.completed, progress.total, run])

  const reset = useCallback((): void => {
    remainingRef.current = []
    destinationIdRef.current = undefined
    isSavingRef.current = false
    setProgress(INITIAL_PROGRESS)
  }, [])

  return {
    ...progress,
    save,
    retry,
    reset,
  }
}
