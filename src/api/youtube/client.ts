import { YouTubeError, toYouTubeErrorCode } from '@/api/youtube/errors'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

// ================= TEMP HARNESS — NEVER COMMIT =================
interface IHW {
  __req__: { method: string; path: string; params: Record<string, string>; body?: unknown }[]
  __dest__: () => string[]
  __failAfter__: number
}
function hw(): IHW {
  const scope = globalThis as unknown as IHW
  scope.__req__ ??= []
  scope.__failAfter__ ??= -1
  return scope
}
// SOURCE: 8 videos VS1..VS8. DEST: 3 videos, one of which (VS3) is also in SOURCE.
const H_SOURCE = Array.from({ length: 8 }, (_, i) => ({ id: `S${String(i + 1)}`, videoId: `VS${String(i + 1)}` }))
const H_DEST = [
  { id: 'D1', videoId: 'VD1' },
  { id: 'D2', videoId: 'VS3' },
  { id: 'D3', videoId: 'VD3' },
]
hw().__dest__ = () => H_DEST.map((d) => d.videoId)
function row(it: { id: string; videoId: string }, label: string) {
  return {
    id: it.id,
    snippet: { title: `${label} ${it.videoId}`, videoOwnerChannelTitle: 'Chan', thumbnails: { medium: { url: '' } } },
    contentDetails: { videoId: it.videoId },
    status: { privacyStatus: 'public' },
  }
}
async function harnessRespond(method: string, path: string, params: Record<string, string>, body?: unknown) {
  const scope = hw()
  scope.__req__.push({ method, path, params, body })
  await new Promise((r) => setTimeout(r, 40))
  if (path === '/playlists') {
    return {
      items: [
        {
          id: 'PL_SRC',
          snippet: { title: 'SOURCE list' },
          contentDetails: { itemCount: 8 },
          status: { privacyStatus: 'public' },
        },
        {
          id: 'PL_DST',
          snippet: { title: 'DEST list' },
          contentDetails: { itemCount: 3 },
          status: { privacyStatus: 'public' },
        },
        {
          id: 'PL_C',
          snippet: { title: 'Third list' },
          contentDetails: { itemCount: 0 },
          status: { privacyStatus: 'public' },
        },
      ],
      pageInfo: { totalResults: 3 },
    }
  }
  if (path === '/playlistItems' && method === 'GET') {
    if (params.playlistId === 'PL_SRC')
      return { items: H_SOURCE.map((i) => row(i, 'Src')), pageInfo: { totalResults: 8 } }
    if (params.playlistId === 'PL_DST')
      return { items: H_DEST.map((i) => row(i, 'Dst')), pageInfo: { totalResults: 3 } }
    return { items: [], pageInfo: { totalResults: 0 } }
  }
  if (path === '/videos') return { items: [] }
  if (path === '/playlistItems' && method === 'POST') {
    const puts = scope.__req__.filter((r) => r.method === 'POST').length
    if (scope.__failAfter__ >= 0 && puts > scope.__failAfter__) throw new Error('harness forced failure')
    const rec = body as { snippet: { resourceId: { videoId: string }; position?: number } }
    const entry = { id: `NEW${String(H_DEST.length + 1)}`, videoId: rec.snippet.resourceId.videoId }
    if (rec.snippet.position === undefined) H_DEST.push(entry)
    else H_DEST.splice(rec.snippet.position, 0, entry)
    return {}
  }
  return {}
}
// =============== END TEMP HARNESS ===============

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
  return harnessRespond(method, path, params, body)

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
