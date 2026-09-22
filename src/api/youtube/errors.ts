export type YouTubeErrorCode =
  | 'network'
  | 'authExpired'
  | 'quotaExceeded'
  | 'apiNotEnabled'
  | 'insufficientPermissions'
  | 'notFound'
  | 'playlistFull'
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readReasons(body: unknown): string[] {
  if (!isRecord(body) || !isRecord(body.error) || !Array.isArray(body.error.errors)) {
    return []
  }

  return body.error.errors
    .filter(isRecord)
    .map((detail) => detail.reason)
    .filter((reason): reason is string => typeof reason === 'string')
}

export function toYouTubeErrorCode(status: number, body: unknown): YouTubeErrorCode {
  if (status === 401) return 'authExpired'

  if (status === 403) {
    const reasons = readReasons(body)

    if (reasons.some((reason) => ['quotaExceeded', 'rateLimitExceeded'].includes(reason))) {
      return 'quotaExceeded'
    }

    if (reasons.includes('accessNotConfigured')) return 'apiNotEnabled'
    if (reasons.includes('playlistContainsMaximumNumberOfVideos')) return 'playlistFull'

    return 'insufficientPermissions'
  }

  if (status === 404) return 'notFound'
  if (status >= 500) return 'service'

  return 'unknown'
}
