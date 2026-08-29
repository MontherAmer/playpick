import { useCallback, useRef, useState } from 'react'

import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { updatePlaylistItemPosition } from '@/api/youtube/playlistItems'
import { useAuth } from '@/features/auth/useAuth'
import type { IMove, IPlaylistItem } from '@/models/playlistItem'

export type SaveStatus = 'idle' | 'saving' | 'succeeded' | 'failed'

export interface ISaveOrder {
  status: SaveStatus
  /** The plan length captured when Save was pressed, so it cannot move mid-run. */
  total: number
  /** Moves confirmed applied. Never rolled back. */
  completed: number
  failure: YouTubeErrorCode | null
  /** What a retry will attempt. */
  remaining: IMove[]
  save: (plan: IMove[], items: IPlaylistItem[]) => Promise<void>
  retry: () => Promise<void>
  reset: () => void
}

interface ISaveState {
  status: SaveStatus
  total: number
  completed: number
  failure: YouTubeErrorCode | null
  remaining: IMove[]
}

const INITIAL: ISaveState = { status: 'idle', total: 0, completed: 0, failure: null, remaining: [] }

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

/**
 * Applies a move plan to YouTube, one move at a time.
 *
 * **Sequential, never concurrent.** Each update shifts its neighbours, so
 * parallel position writes race each other into exactly the corruption the
 * plan's ordering exists to prevent.
 *
 * **Stops at the first failure.** Every later move assumes each earlier one
 * landed; pressing on would apply them against an order that has diverged from
 * the plan and produce an arrangement nobody asked for. Stopping leaves the
 * playlist correctly ordered up to that point, and the remainder retryable.
 *
 * Completed work is never rolled back or re-applied — a retry attempts only
 * what is left.
 */
export function useSaveOrder(playlistId: string): ISaveOrder {
  const { getAccessToken } = useAuth()
  const [state, setState] = useState<ISaveState>(INITIAL)

  // A ref rather than `status`, because two presses in one tick would both read
  // the pre-render value and start two runs against the same playlist.
  const inFlightRef = useRef(false)

  const run = useCallback(
    async (moves: IMove[], items: IPlaylistItem[], alreadyCompleted: number, total: number) => {
      if (inFlightRef.current) return

      inFlightRef.current = true

      const videoIdById = new Map(items.map((item) => [item.id, item.videoId]))

      let completed = alreadyCompleted
      let outstanding = [...moves]

      setState({ status: 'saving', total, completed, failure: null, remaining: outstanding })

      for (const move of moves) {
        const videoId = videoIdById.get(move.id)

        if (videoId === undefined) {
          // The plan names an item the draft no longer holds. Unreachable, but
          // reporting it beats writing a position for a video we cannot name.
          setState({ status: 'failed', total, completed, failure: 'notFound', remaining: outstanding })
          inFlightRef.current = false

          return
        }

        try {
          await updatePlaylistItemPosition(getAccessToken, {
            playlistItemId: move.id,
            playlistId,
            videoId,
            position: move.toPosition,
          })
        } catch (cause) {
          setState({ status: 'failed', total, completed, failure: toErrorCode(cause), remaining: outstanding })
          inFlightRef.current = false

          return
        }

        completed += 1
        outstanding = outstanding.slice(1)

        setState({ status: 'saving', total, completed, failure: null, remaining: outstanding })
      }

      setState({ status: 'succeeded', total, completed, failure: null, remaining: [] })
      inFlightRef.current = false
    },
    [getAccessToken, playlistId],
  )

  const itemsRef = useRef<IPlaylistItem[]>([])

  const save = useCallback(
    async (plan: IMove[], items: IPlaylistItem[]) => {
      if (plan.length === 0) return

      itemsRef.current = items

      await run(plan, items, 0, plan.length)
    },
    [run],
  )

  const retry = useCallback(async () => {
    if (state.remaining.length === 0) return

    await run(state.remaining, itemsRef.current, state.completed, state.total)
  }, [run, state.remaining, state.completed, state.total])

  const reset = useCallback(() => {
    setState(INITIAL)
  }, [])

  return { ...state, save, retry, reset }
}
