import { useCallback, useRef, useState } from 'react'

import { addPlaylistVideo, removePlaylistVideo } from '@/api/youtube/resources'
import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { useAuth } from '@/hooks/use-auth'
import type { ISaveProgress } from '@/models/copy.interface'
import type { IMoveStep } from '@/models/move.interface'

const INITIAL_PROGRESS: ISaveProgress = {
  status: 'idle',
  completed: 0,
  total: 0,
  error: null,
}

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

export function useMoveSave(destinationPlaylistId?: string) {
  const { getAccessToken } = useAuth()
  const [progress, setProgress] = useState<ISaveProgress>(INITIAL_PROGRESS)
  const remainingRef = useRef<IMoveStep[]>([])
  const isSavingRef = useRef(false)

  const run = useCallback(
    async (
      steps: readonly IMoveStep[],
      completedBeforeRun: number,
      total: number,
    ): Promise<boolean> => {
      if (!destinationPlaylistId || isSavingRef.current || steps.length === 0) return false

      isSavingRef.current = true
      let completed = completedBeforeRun
      let remaining = [...steps]
      remainingRef.current = remaining
      setProgress({ status: 'saving', completed, total, error: null })

      for (const step of steps) {
        let currentStep = step

        try {
          if (!currentStep.destinationAdded) {
            await addPlaylistVideo(getAccessToken, destinationPlaylistId, currentStep.videoId)
            currentStep = { ...currentStep, destinationAdded: true }
          }

          await removePlaylistVideo(getAccessToken, currentStep.sourcePlaylistItemId)
        } catch (cause) {
          if (
            currentStep.destinationAdded &&
            cause instanceof YouTubeError &&
            cause.code === 'notFound'
          ) {
            completed += 1
            remaining = remaining.slice(1)
            remainingRef.current = remaining
            setProgress({ status: 'saving', completed, total, error: null })
            continue
          }

          remaining = [currentStep, ...remaining.slice(1)]
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
    [destinationPlaylistId, getAccessToken],
  )

  const save = useCallback(
    (steps: readonly IMoveStep[]): Promise<boolean> => run(steps, 0, steps.length),
    [run],
  )

  const retry = useCallback(
    (): Promise<boolean> =>
      run(remainingRef.current, progress.completed, progress.total),
    [progress.completed, progress.total, run],
  )

  const reset = useCallback((): void => {
    remainingRef.current = []
    isSavingRef.current = false
    setProgress(INITIAL_PROGRESS)
  }, [])

  return { ...progress, save, retry, reset }
}
