import { YouTubeError, toYouTubeErrorCode } from '@/api/youtube/errors'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

/** An aborted request is a cancellation, not a failure — it must not be wrapped. */
function isAbortError(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === 'AbortError'
}

/**
 * A failed response may carry no body at all, or an HTML error page rather than
 * JSON. Neither is worth failing over — the status alone still classifies it.
 */
async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

/** Google's `error.message`, kept for developer-facing diagnostics only. */
function readErrorMessage(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined

  const { error } = body as { error?: unknown }

  if (typeof error !== 'object' || error === null) return undefined

  const { message } = error as { message?: unknown }

  return typeof message === 'string' ? message : undefined
}

/**
 * Performs one authorized request against the YouTube Data API and returns the
 * parsed body as `unknown`, for the caller to narrow.
 *
 * Takes a token *getter* rather than a token so a caller cannot hold a stale
 * one; `getAccessToken` renews silently and rejects only when the grant is
 * genuinely gone, which is why any rejection from it means `authExpired` rather
 * than a retry here.
 *
 * Rejects with `YouTubeError` for every failure except cancellation, which
 * propagates unchanged. The access token is sent as a header and never appears
 * in a URL, a message, or a log line.
 */
async function youtubeRequest(
  method: 'GET' | 'PUT' | 'POST',
  getAccessToken: () => Promise<string>,
  path: string,
  params: Record<string, string>,
  body?: unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  let accessToken: string

  try {
    accessToken = await getAccessToken()
  } catch {
    throw new YouTubeError('authExpired', 'No usable access token')
  }

  const url = `${YOUTUBE_API_BASE}${path}?${new URLSearchParams(params).toString()}`

  const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  let response: Response

  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (cause) {
    if (isAbortError(cause)) throw cause

    throw new YouTubeError('network', `Could not reach ${path}`)
  }

  const responseBody = await readBody(response)

  if (!response.ok) {
    const code = toYouTubeErrorCode(response.status, responseBody)

    // The message is diagnostic only. Never render it — components translate
    // `errors.youtube.<code>` instead.
    throw new YouTubeError(code, readErrorMessage(responseBody) ?? `${path} responded with ${String(response.status)}`)
  }

  return responseBody
}

/** Reads from the API. See `youtubeRequest` for the shared guarantees. */
export async function youtubeGet(
  getAccessToken: () => Promise<string>,
  path: string,
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<unknown> {
  return youtubeRequest('GET', getAccessToken, path, params, undefined, signal)
}

/**
 * Writes to the API — the first thing in PlayPick that changes anything on
 * YouTube.
 *
 * Deliberately a second named function rather than a generic
 * `youtubeRequest(method, …)` export: a call site that reads `youtubePut` says
 * plainly that it mutates, which is worth more here than one fewer function.
 *
 * The error taxonomy needs no extension for writes — `toYouTubeErrorCode`
 * classifies a failed write no differently from a failed read.
 */
export async function youtubePut(
  getAccessToken: () => Promise<string>,
  path: string,
  params: Record<string, string>,
  body: unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  return youtubeRequest('PUT', getAccessToken, path, params, body, signal)
}

/**
 * Creates a resource — adding a video to a playlist.
 *
 * A third named function rather than a generic exported `youtubeRequest`, for
 * the same reason as `youtubePut`: a call site that reads `youtubePost` says
 * plainly that it creates something.
 */
export async function youtubePost(
  getAccessToken: () => Promise<string>,
  path: string,
  params: Record<string, string>,
  body: unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  return youtubeRequest('POST', getAccessToken, path, params, body, signal)
}
