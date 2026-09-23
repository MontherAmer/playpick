import { useCallback, useRef, useState } from 'react'

import { addPlaylistVideo, createPlaylist } from '@/api/youtube/resources'
import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { useAuth } from '@/hooks/use-auth'
import type {
  IBuildSaveState,
  IBuildStep,
  IPlaylistDraft,
} from '@/models/build.interface'
import type { IPlaylist } from '@/models/copy.interface'

const INITIAL_STATE: IBuildSaveState = {
  status: 'idle',
  completed: 0,
  total: 0,
  error: null,
  failedDuring: null,
  targetPlaylist: null,
}

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

export function useBuildSave() {
  const { getAccessToken } = useAuth()
  const [state, setState] = useState<IBuildSaveState>(INITIAL_STATE)
  const draftRef = useRef<IPlaylistDraft | null>(null)
  const targetRef = useRef<IPlaylist | null>(null)
  const remainingRef = useRef<IBuildStep[]>([])
  const inFlightRef = useRef(false)

  const run = useCallback(
    async (
      steps: readonly IBuildStep[],
      draft: IPlaylistDraft,
      completedBeforeRun: number,
      total: number,
    ): Promise<boolean> => {
      if (inFlightRef.current) return false

      inFlightRef.current = true
      let target = targetRef.current

      if (!target) {
        setState({
          status: 'creating',
          completed: completedBeforeRun,
          total,
          error: null,
          failedDuring: null,
          targetPlaylist: null,
        })

        try {
          target = await createPlaylist(getAccessToken, draft)
          targetRef.current = target
        } catch (cause) {
          setState({
            status: 'failed',
            completed: completedBeforeRun,
            total,
            error: toErrorCode(cause),
            failedDuring: 'create',
            targetPlaylist: null,
          })
          inFlightRef.current = false

          return false
        }
      }

      let completed = completedBeforeRun
      let remaining = [...steps]
      remainingRef.current = remaining
      setState({
        status: 'adding',
        completed,
        total,
        error: null,
        failedDuring: null,
        targetPlaylist: target,
      })

      for (const step of steps) {
        try {
          await addPlaylistVideo(getAccessToken, target.id, step.videoId)
        } catch (cause) {
          remainingRef.current = remaining
          setState({
            status: 'failed',
            completed,
            total,
            error: toErrorCode(cause),
            failedDuring: 'add',
            targetPlaylist: target,
          })
          inFlightRef.current = false

          return false
        }

        completed += 1
        remaining = remaining.slice(1)
        remainingRef.current = remaining
        setState({
          status: 'adding',
          completed,
          total,
          error: null,
          failedDuring: null,
          targetPlaylist: target,
        })
      }

      setState({
        status: 'succeeded',
        completed,
        total,
        error: null,
        failedDuring: null,
        targetPlaylist: target,
      })
      inFlightRef.current = false

      return true
    },
    [getAccessToken],
  )

  const save = useCallback(
    (steps: readonly IBuildStep[], draft: IPlaylistDraft): Promise<boolean> => {
      draftRef.current = draft
      remainingRef.current = [...steps]

      return run(steps, draft, 0, steps.length)
    },
    [run],
  )

  const retry = useCallback((): Promise<boolean> => {
    const draft = draftRef.current

    if (!draft) return Promise.resolve(false)

    return run(remainingRef.current, draft, state.completed, state.total)
  }, [run, state.completed, state.total])

  const reset = useCallback((): void => {
    draftRef.current = null
    targetRef.current = null
    remainingRef.current = []
    inFlightRef.current = false
    setState(INITIAL_STATE)
  }, [])

  return { ...state, save, retry, reset }
}
