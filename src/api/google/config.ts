import { AuthError } from '@/api/google/errors'

/**
 * Scopes requested at consent time.
 *
 * `auth/youtube` grants read *and* write. Every MVP tool (reorder, copy,
 * create) mutates playlists, so requesting read-only first would force a second
 * consent prompt as soon as those land. Narrow this to
 * `https://www.googleapis.com/auth/youtube.readonly` if you would rather defer
 * the write grant.
 *
 * Note: `auth/youtube` is a *restricted* scope — Google requires app
 * verification before it can be used outside your own test users.
 */
export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/youtube',
]

/**
 * The OAuth client id is a public value — it ships in the bundle by design.
 * The client *secret* must never appear in a `VITE_*` variable.
 */
export function getGoogleClientId(): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

  if (!clientId) {
    throw new AuthError(
      'missingClientId',
      'VITE_GOOGLE_CLIENT_ID is not set. Copy .env.example to .env.local and fill it in.',
    )
  }

  return clientId
}
