import { useCallback, useRef, useState } from 'react'

import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { addPlaylistItem } from '@/api/youtube/playlistItems'
import { createPlaylist } from '@/api/youtube/playlists'
import { useAuth } from '@/features/auth/useAuth'
import { useAddCreatedPlaylist } from '@/features/playlists/usePlaylistLibrary'
import type { IBuildDestination, IBuildStep } from '@/models/build'
import type { IPlaylist } from '@/models/playlist'

export type BuildSaveStatus = 'idle' | 'creating' | 'adding' | 'succeeded' | 'failed'

export interface IBuildSave {
  status: BuildSaveStatus
  /** The plan length captured when the save began, so it cannot move mid-run. */
  total: number
  /** Videos confirmed added. Never rolled back, never re-added. */
  completed: number
  failure: YouTubeErrorCode | null
  /** Which half failed, so the UI can say the playlist exists but is incomplete. */
  failedDuring: 'create' | 'add' | null
  /**
   * The playlist this run created, once it exists.
   *
   * Load-bearing: while this is set, a retry resumes at the **add** step.
   */
  createdPlaylist: IPlaylist | null
  /** What a retry will attempt. */
  remaining: IBuildStep[]
  /** The playlist the videos went to, for naming it afterwards. */
  targetPlaylist: IPlaylist | null
  /** Resolves `true` only when every video in the plan landed. */
  save: (plan: IBuildStep[], destination: IBuildDestination) => Promise<boolean>
  /** Resolves `true` only when the remainder fully landed. */
  retry: () => Promise<boolean>
  reset: () => void
}

interface ISaveState {
  status: BuildSaveStatus
  total: number
  completed: number
  failure: YouTubeErrorCode | null
  failedDuring: 'create' | 'add' | null
  createdPlaylist: IPlaylist | null
  remaining: IBuildStep[]
  targetPlaylist: IPlaylist | null
}

const INITIAL: ISaveState = {
  status: 'idle',
  total: 0,
  completed: 0,
  failure: null,
  failedDuring: null,
  createdPlaylist: null,
  remaining: [],
  targetPlaylist: null,
}

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

/**
 * Carries out a build: create the destination if it does not exist yet, then add
 * the videos to it, one at a time.
 *
 * ## The create-once rule is why this hook exists
 *
 * A retry after a half-finished run must **never create a second playlist**.
 * PlayPick offers no way to delete one — deleting is out of scope in every
 * feature so far — so a duplicate playlist is permanent and is left for the
 * person to clean up on YouTube themselves. `createdPlaylist` is what prevents
 * it: once set, every retry re-enters at the add step and the creation is not
 * reconsidered.
 *
 * This is also why the write path is not shared with `useCopySave`. The inner
 * loop is the same, but Copy has no concept of a prelude that must not repeat,
 * and pushing one into a merged, verified write path to save twenty-five lines
 * would risk more than it saves.
 *
 * **Sequential, never concurrent**, and it **stops at the first failure**,
 * leaving the destination correct as far as it got with the remainder
 * retryable. A video added once is never added again.
 *
 * Failure is carried as a `YouTubeErrorCode` and nothing else. No message, HTTP
 * status, access token or request URL is captured, stored or returned.
 *
 * **No source playlist is named anywhere in this hook.** There is no code path
 * here that could write to one.
 */
export function useBuildSave(): IBuildSave {
  const { getAccessToken } = useAuth()
  const addCreatedPlaylist = useAddCreatedPlaylist()
  const [state, setState] = useState<ISaveState>(INITIAL)

  // A ref rather than `status`: two activations in one tick would both read the
  // pre-render value and start two runs — creating two playlists.
  const inFlightRef = useRef(false)
  // Mirrors `createdPlaylist` so a retry issued before React has re-rendered
  // still sees it. The whole create-once rule rests on this being current.
  const createdRef = useRef<IPlaylist | null>(null)

  const run = useCallback(
    async (
      steps: IBuildStep[],
      destination: IBuildDestination,
      alreadyCompleted: number,
      total: number,
    ): Promise<boolean> => {
      if (inFlightRef.current) return false

      inFlightRef.current = true

      const finish = (next: ISaveState) => {
        setState(next)
        inFlightRef.current = false
      }

      let target: IPlaylist
      let created = createdRef.current

      if (destination.kind === 'existing') {
        target = destination.playlist
      } else if (created !== null) {
        // Already created by an earlier attempt. Do not create it again.
        target = created
      } else {
        setState({
          status: 'creating',
          total,
          completed: alreadyCompleted,
          failure: null,
          failedDuring: null,
          createdPlaylist: null,
          remaining: steps,
          targetPlaylist: null,
        })

        try {
          created = await createPlaylist(getAccessToken, {
            title: destination.draft.title,
            description: destination.draft.description,
            // Guarded by the caller: an unsubmittable draft never reaches here.
            privacy: destination.draft.privacy ?? 'private',
          })
        } catch (cause) {
          finish({
            status: 'failed',
            total,
            completed: alreadyCompleted,
            failure: toErrorCode(cause),
            failedDuring: 'create',
            createdPlaylist: null,
            remaining: steps,
            targetPlaylist: null,
          })

          return false
        }

        createdRef.current = created
        target = created

        // Offered to every chooser at once, without a reload and without a
        // request — the rule feature 005 established.
        addCreatedPlaylist(created)
      }

      let completed = alreadyCompleted
      let outstanding = [...steps]

      setState({
        status: 'adding',
        total,
        completed,
        failure: null,
        failedDuring: null,
        createdPlaylist: created,
        remaining: outstanding,
        targetPlaylist: target,
      })

      for (const step of steps) {
        try {
          // No position: appending in order reproduces the draft, and a request
          // that carries no position cannot be refused for an out-of-range one.
          await addPlaylistItem(getAccessToken, { playlistId: target.id, videoId: step.videoId })
        } catch (cause) {
          finish({
            status: 'failed',
            total,
            completed,
            failure: toErrorCode(cause),
            failedDuring: 'add',
            createdPlaylist: created,
            remaining: outstanding,
            targetPlaylist: target,
          })

          return false
        }

        completed += 1
        outstanding = outstanding.slice(1)

        setState({
          status: 'adding',
          total,
          completed,
          failure: null,
          failedDuring: null,
          createdPlaylist: created,
          remaining: outstanding,
          targetPlaylist: target,
        })
      }

      finish({
        status: 'succeeded',
        total,
        completed,
        failure: null,
        failedDuring: null,
        createdPlaylist: created,
        remaining: [],
        targetPlaylist: target,
      })

      return true
    },
    [getAccessToken, addCreatedPlaylist],
  )

  // Held so a retry knows what it was doing without the caller re-supplying it.
  const destinationRef = useRef<IBuildDestination | null>(null)

  const save = useCallback(
    async (plan: IBuildStep[], destination: IBuildDestination) => {
      if (plan.length === 0) return false

      destinationRef.current = destination

      return run(plan, destination, 0, plan.length)
    },
    [run],
  )

  const retry = useCallback(async () => {
    const destination = destinationRef.current

    if (state.remaining.length === 0 || destination === null) return false

    return run(state.remaining, destination, state.completed, state.total)
  }, [run, state.remaining, state.completed, state.total])

  const reset = useCallback(() => {
    createdRef.current = null
    destinationRef.current = null
    setState(INITIAL)
  }, [])

  return { ...state, save, retry, reset }
}
