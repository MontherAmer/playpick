import type { AuthErrorCode } from '@/api/google/errors'
import type { IUser } from '@/models/user.interface'

export type AuthStatus =
  | 'restoring'
  | 'unauthenticated'
  | 'signingIn'
  | 'authenticated'

export interface IAuthContextValue {
  status: AuthStatus
  user: IUser | null
  isAuthenticated: boolean
  error: AuthErrorCode | null
  signIn: () => Promise<boolean>
  signOut: () => void
  getAccessToken: () => Promise<string>
}
