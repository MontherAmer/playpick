/**
 * Every code maps to an `errors.youtube.<code>` translation key, so new codes
 * must be added to both locale files.
 */
export type YouTubeErrorCode =
  | 'network'
  | 'authExpired'
  | 'quotaExceeded'
  | 'apiNotEnabled'
  | 'insufficientPermissions'
  | 'notFound'
  | 'playlistFull'
  | 'playlistLimitReached'
  | 'invalidPlaylistDetails'
  | 'service'
  | 'unknown'

export class YouTubeError extends Error {
  readonly code: YouTubeErrorCode

  constructor(code: YouTubeErrorCode, message?: string) {
    super(message ?? code)

    this.name = 'YouTubeError'
    this.code = code
  }
}

/**
 * Google's `errors[].reason` values that mean the quota is spent, as opposed to
 * the caller not being allowed to do this at all. Both arrive as HTTP 403, so
 * the reason is the only thing separating them.
 */
const QUOTA_REASONS: readonly string[] = ['quotaExceeded', 'rateLimitExceeded']

/**
 * The third meaning of 403: the YouTube Data API is not enabled on the Google
 * Cloud project at all.
 *
 * Nothing the user does can fix this — not signing in again, not granting a
 * scope, not waiting for a quota to reset. Folding it into
 * `insufficientPermissions` produced a message telling the user to re-grant
 * YouTube access, which could never work. It is a deployment misconfiguration
 * and has to read like one.
 */
const API_NOT_ENABLED_REASONS: readonly string[] = ['accessNotConfigured']

/**
 * The fourth meaning of 403: the destination playlist is at YouTube's maximum
 * size.
 *
 * Without this it falls through to `insufficientPermissions`, which tells the
 * person to sign in again and grant access — advice that cannot possibly work,
 * for a problem that has nothing to do with permissions.
 */
const PLAYLIST_FULL_REASONS: readonly string[] = ['playlistContainsMaximumNumberOfVideos']

/**
 * The account already holds as many playlists as YouTube allows.
 *
 * Distinct from `playlistFull`, and the names are worth keeping apart: this one
 * is about the *account* holding too many playlists, that one about a *playlist*
 * holding too many videos. They arrive from different operations and neither
 * message would make sense in the other's place.
 */
const PLAYLIST_LIMIT_REASONS: readonly string[] = ['maxPlaylistExceeded']

/**
 * YouTube refused the playlist details themselves — in practice the title.
 *
 * The only failure here the person caused and the only one they can fix by
 * editing, which is why it is worth separating from a generic bad request: it
 * is attributed to the field rather than shown as a page-level error.
 */
const INVALID_PLAYLIST_REASONS: readonly string[] = ['invalidPlaylistSnippet', 'playlistTitleRequired']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Pulls `error.errors[].reason` out of an untrusted response body.
 *
 * Structurally validated rather than cast: the body is whatever the network
 * returned, so nothing about it is guaranteed. Mirrors `IYouTubeErrorResponse`
 * in `./types`, which documents the same envelope.
 */
function readErrorReasons(body: unknown): string[] {
  if (!isRecord(body) || !isRecord(body.error) || !Array.isArray(body.error.errors)) {
    return []
  }

  return body.error.errors
    .filter(isRecord)
    .map((detail) => detail.reason)
    .filter((reason): reason is string => typeof reason === 'string')
}

/**
 * Classifies a failed response.
 *
 * Never returns `network` — that case has no HTTP status, and is raised
 * directly by the client when `fetch` itself rejects.
 */
export function toYouTubeErrorCode(status: number, body: unknown): YouTubeErrorCode {
  if (status === 401) {
    return 'authExpired'
  }

  if (status === 403) {
    const reasons = readErrorReasons(body)

    if (reasons.some((reason) => QUOTA_REASONS.includes(reason))) return 'quotaExceeded'
    if (reasons.some((reason) => API_NOT_ENABLED_REASONS.includes(reason))) return 'apiNotEnabled'
    // Checked before the fallthrough: a full playlist is not a permissions problem.
    if (reasons.some((reason) => PLAYLIST_FULL_REASONS.includes(reason))) return 'playlistFull'

    return 'insufficientPermissions'
  }

  // Reasons are read on 400 as well as 403, additively: an unrecognised 400
  // still falls through to `unknown` exactly as it did before.
  if (status === 400) {
    const reasons = readErrorReasons(body)

    if (reasons.some((reason) => PLAYLIST_LIMIT_REASONS.includes(reason))) return 'playlistLimitReached'
    if (reasons.some((reason) => INVALID_PLAYLIST_REASONS.includes(reason))) return 'invalidPlaylistDetails'
  }

  if (status === 404) {
    return 'notFound'
  }

  if (status >= 500) {
    return 'service'
  }

  return 'unknown'
}
