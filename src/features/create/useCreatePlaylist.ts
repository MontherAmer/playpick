import { useCallback, useRef, useState } from 'react'

import { YouTubeError, type YouTubeErrorCode } from '@/api/youtube/errors'
import { createPlaylist } from '@/api/youtube/playlists'
import { useAuth } from '@/features/auth/useAuth'
import { isDraftSubmittable } from '@/features/create/validatePlaylistDraft'
import type { IPlaylist } from '@/models/playlist'
import type { IPlaylistDraft } from '@/models/playlistDraft'

export type CreateStatus = 'idle' | 'creating' | 'succeeded' | 'failed'

export interface ICreatePlaylist {
  status: CreateStatus
  created: IPlaylist | null
  /** The whole failure payload. No message, status, token or URL is ever kept. */
  failure: YouTubeErrorCode | null
  /** Resolves `true` only when a playlist was actually created. */
  submit: (draft: IPlaylistDraft) => Promise<boolean>
  reset: () => void
}

interface ICreateState {
  status: CreateStatus
  created: IPlaylist | null
  failure: YouTubeErrorCode | null
}

const INITIAL: ICreateState = { status: 'idle', created: null, failure: null }

function toErrorCode(cause: unknown): YouTubeErrorCode {
  return cause instanceof YouTubeError ? cause.code : 'unknown'
}

/**
 * Creates one playlist, once.
 *
 * **The guard is the point of this hook.** A second creation is a real playlist
 * on a real account, and PlayPick offers no way to delete one — editing and
 * deleting are out of scope in every feature so far — so a duplicate is left for
 * the person to clean up on YouTube themselves. That, not quota, is why this is
 * defended as carefully as it is.
 *
 * The guard is a ref rather than `status`: two activations in one tick would
 * both read the pre-render value and start two creations. That is not
 * theoretical here — Enter in a text field submits a form, and a held Enter
 * repeats.
 *
 * Failure is carried as a `YouTubeErrorCode` and nothing else. No message, HTTP
 * status, access token or request URL is captured, stored or returned, so there
 * is no path by which one could reach the screen.
 */
export function useCreatePlaylist(onCreated?: (playlist: IPlaylist) => void): ICreatePlaylist {
  const { getAccessToken } = useAuth()
  const [state, setState] = useState<ICreateState>(INITIAL)

  const inFlightRef = useRef(false)

  const submit = useCallback(
    async (draft: IPlaylistDraft) => {
      // Guarded here rather than only on the button: the rule belongs where the
      // request is made, not only where it is offered.
      if (inFlightRef.current) return false
      if (!isDraftSubmittable(draft) || draft.privacy === null) return false

      inFlightRef.current = true
      setState({ status: 'creating', created: null, failure: null })

      let created: IPlaylist

      try {
        created = await createPlaylist(getAccessToken, {
          title: draft.title,
          description: draft.description,
          privacy: draft.privacy,
        })
      } catch (cause) {
        setState({ status: 'failed', created: null, failure: toErrorCode(cause) })
        inFlightRef.current = false

        return false
      }

      // Only on a confirmed success: a failed creation must add nothing.
      onCreated?.(created)

      setState({ status: 'succeeded', created, failure: null })
      inFlightRef.current = false

      return true
    },
    [getAccessToken, onCreated],
  )

  const reset = useCallback(() => {
    setState(INITIAL)
  }, [])

  return { ...state, submit, reset }
}
