import { useCallback, useRef, useState } from 'react'

import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { addPlaylistItem } from '@/api/youtube/playlistItems'
import { useAuth } from '@/features/auth/useAuth'
import type { ICopyStep } from '@/models/copy'

export type CopySaveStatus = 'idle' | 'saving' | 'succeeded' | 'failed'

export interface ICopySave {
  status: CopySaveStatus
  /** The plan length captured when Save was pressed, so it cannot move mid-run. */
  total: number
  /** Videos confirmed added. Never rolled back, never re-added. */
  completed: number
  failure: YouTubeErrorCode | null
  /** What a retry will attempt. */
  remaining: ICopyStep[]
  /** Resolves `true` only when every video in the plan landed. */
  save: (plan: ICopyStep[]) => Promise<boolean>
  /** Resolves `true` only when the remainder fully landed. */
  retry: () => Promise<boolean>
  reset: () => void
}

interface ISaveState {
  status: CopySaveStatus
  total: number
  completed: number
  failure: YouTubeErrorCode | null
  remaining: ICopyStep[]
}

const INITIAL: ISaveState = { status: 'idle', total: 0, completed: 0, failure: null, remaining: [] }

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

/**
 * Adds a copy plan's videos to the destination, one at a time.
 *
 * **Sequential, never concurrent.** Each insert shifts the positions of
 * everything after it, so parallel writes would race each other into an order
 * nobody asked for.
 *
 * **Stops at the first failure.** Every later position assumes each earlier
 * insert landed; pressing on would place videos against a list that has
 * diverged from the plan. Stopping leaves the destination correct as far as it
 * got, with the remainder retryable.
 *
 * A video added once is never added again — the failure path keeps the completed
 * count and retries only what is left, so a retry cannot duplicate work.
 *
 * Deliberately mirrors `useSaveOrder` rather than sharing an engine with it:
 * feature 003 is merged and verified, and refactoring a working write path for
 * this feature's benefit would risk more than it saves. The extraction is
 * recorded for when a third writing tool exists.
 */
export function useCopySave(playlistId: string | undefined): ICopySave {
  const { getAccessToken } = useAuth()
  const [state, setState] = useState<ISaveState>(INITIAL)

  // A ref rather than `status`: two presses in one tick would both read the
  // pre-render value and start two runs against the same playlist.
  const inFlightRef = useRef(false)

  const run = useCallback(
    async (steps: ICopyStep[], alreadyCompleted: number, total: number): Promise<boolean> => {
      if (inFlightRef.current || playlistId === undefined) return false

      inFlightRef.current = true

      let completed = alreadyCompleted
      let outstanding = [...steps]

      setState({ status: 'saving', total, completed, failure: null, remaining: outstanding })

      for (const step of steps) {
        try {
          await addPlaylistItem(getAccessToken, {
            playlistId,
            videoId: step.videoId,
            position: step.position,
          })
        } catch (cause) {
          setState({ status: 'failed', total, completed, failure: toErrorCode(cause), remaining: outstanding })
          inFlightRef.current = false

          return false
        }

        completed += 1
        outstanding = outstanding.slice(1)

        setState({ status: 'saving', total, completed, failure: null, remaining: outstanding })
      }

      setState({ status: 'succeeded', total, completed, failure: null, remaining: [] })
      inFlightRef.current = false

      return true
    },
    [getAccessToken, playlistId],
  )

  const save = useCallback(
    async (plan: ICopyStep[]) => {
      if (plan.length === 0) return false

      return run(plan, 0, plan.length)
    },
    [run],
  )

  const retry = useCallback(async () => {
    if (state.remaining.length === 0) return false

    return run(state.remaining, state.completed, state.total)
  }, [run, state.remaining, state.completed, state.total])

  const reset = useCallback(() => {
    setState(INITIAL)
  }, [])

  return { ...state, save, retry, reset }
}
