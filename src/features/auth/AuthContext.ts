import { createContext } from 'react'

import type { AuthErrorCode } from '@/api/google/errors'
import type { IUser } from '@/models/user'

export type AuthStatus =
  /** Attempting to silently restore a previous grant on page load. */
  'restoring' | 'unauthenticated' | 'signingIn' | 'authenticated'

export interface IAuthContextValue {
  status: AuthStatus
  user: IUser | null
  isAuthenticated: boolean
  /** Last sign-in failure, cleared when a new attempt starts. */
  error: AuthErrorCode | null
  /** Resolves to `true` when the user ends up signed in. Never rejects. */
  signIn: () => Promise<boolean>
  signOut: () => void
  /**
   * Returns a currently-valid access token for the YouTube API layer,
   * silently renewing it when it is close to expiry. Rejects with an
   * `AuthError` if the grant can no longer be renewed.
   */
  getAccessToken: () => Promise<string>
}

export const AuthContext = createContext<IAuthContextValue | null>(null)
