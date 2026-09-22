import type { ICopyStep, IPendingCopy, IVideo } from '@/models/copy.interface'

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/
const PLAYLIST_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/

function toUrl(value: string): URL | null {
  try {
    return new URL(value.trim())
  } catch {
    return null
  }
}

export function parsePlaylistId(value: string): string | null {
  const input = value.trim()

  if (PLAYLIST_ID_PATTERN.test(input)) return input

  const url = toUrl(input)
  const playlistId = url?.searchParams.get('list')

  return playlistId && PLAYLIST_ID_PATTERN.test(playlistId) ? playlistId : null
}

export function parseVideoIds(value: string): string[] {
  const videoIds = value
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      if (VIDEO_ID_PATTERN.test(entry)) return entry

      const url = toUrl(entry)

      if (!url) return null
      if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] ?? null
      if (url.hostname.endsWith('youtube.com')) {
        return url.searchParams.get('v') ?? url.pathname.match(/\/shorts\/([^/?]+)/)?.[1] ?? null
      }

      return null
    })
    .filter((videoId): videoId is string => videoId !== null && VIDEO_ID_PATTERN.test(videoId))

  return [...new Set(videoIds)]
}

export function createPendingCopies({
  videos,
  destinationVideos,
  currentPending,
}: {
  videos: readonly IVideo[]
  destinationVideos: readonly IVideo[]
  currentPending: readonly IPendingCopy[]
}): IPendingCopy[] {
  const existingIds = new Set(destinationVideos.map((video) => video.videoId))
  const pendingIds = new Set(currentPending.map((copy) => copy.video.videoId))

  return videos.map((video) => {
    const isDuplicate = existingIds.has(video.videoId) || pendingIds.has(video.videoId)
    pendingIds.add(video.videoId)

    return {
      key: `${video.videoId}-${crypto.randomUUID()}`,
      video,
      isDuplicate,
    }
  })
}

export function buildCopyPlan(
  pending: readonly IPendingCopy[],
  includeDuplicates: boolean,
): ICopyStep[] {
  return pending
    .filter((copy) => includeDuplicates || !copy.isDuplicate)
    .map((copy) => ({ key: copy.key, videoId: copy.video.videoId }))
}
