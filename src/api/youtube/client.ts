import { YouTubeError, toYouTubeErrorCode } from './errors'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

function isAbortError(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === 'AbortError'
}

function readErrorMessage(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null || !('error' in body)) return undefined

  const error = body.error

  if (typeof error !== 'object' || error === null || !('message' in error)) return undefined

  return typeof error.message === 'string' ? error.message : undefined
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

async function youtubeRequest({
  method,
  getAccessToken,
  path,
  params,
  body,
  signal,
}: {
  method: 'DELETE' | 'GET' | 'POST'
  getAccessToken: () => Promise<string>
  path: string
  params: Record<string, string>
  body?: unknown
  signal?: AbortSignal
}): Promise<unknown> {
  let accessToken: string

  try {
    accessToken = await getAccessToken()
  } catch {
    throw new YouTubeError('authExpired')
  }

  let response: Response

  try {
    response = await fetch(
      `${YOUTUBE_API_BASE}${path}?${new URLSearchParams(params).toString()}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      },
    )
  } catch (cause) {
    if (isAbortError(cause)) throw cause
    throw new YouTubeError('network')
  }

  const responseBody = await readBody(response)

  if (!response.ok) {
    throw new YouTubeError(
      toYouTubeErrorCode(response.status, responseBody),
      readErrorMessage(responseBody),
    )
  }

  return responseBody
}

export function youtubeGet(
  getAccessToken: () => Promise<string>,
  path: string,
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<unknown> {
  return youtubeRequest({ method: 'GET', getAccessToken, path, params, signal })
}

export function youtubePost(
  getAccessToken: () => Promise<string>,
  path: string,
  params: Record<string, string>,
  body: unknown,
): Promise<unknown> {
  return youtubeRequest({ method: 'POST', getAccessToken, path, params, body })
}

export function youtubeDelete(
  getAccessToken: () => Promise<string>,
  path: string,
  params: Record<string, string>,
): Promise<unknown> {
  return youtubeRequest({ method: 'DELETE', getAccessToken, path, params })
}
