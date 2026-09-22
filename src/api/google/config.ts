import { AuthError } from '@/api/google/errors'

/**
 * Scopes requested at consent time.
 *
 * `auth/youtube` grants read and write so tools can mutate playlists without
 * a second consent prompt. It is a restricted scope — Google requires app
 * verification outside test users.
 */
export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/youtube',
]

/**
 * The OAuth client id is a public value — it ships in the bundle by design.
 * The client secret must never appear in a VITE_* variable.
 */
export function getGoogleClientId(): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

  if (!clientId) {
    throw new AuthError(
      'missingClientId',
      'VITE_GOOGLE_CLIENT_ID is not set. Add it to your .env file.',
    )
  }

  return clientId
}
