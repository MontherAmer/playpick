import { youtubeGet } from '@/api/youtube/client'
import type { IPlaylistItem } from '@/models/playlistItem'

/**
 * The API maximum. One request costs the same single quota unit whatever this
 * is, so the largest page means the fewest round trips.
 */
export const PLAYLIST_ITEMS_PAGE_SIZE = 50

const PLAYLIST_ITEMS_PATH = '/playlistItems'

/** Every part the UI needs: title and thumbnails, the video id, and availability. */
const PLAYLIST_ITEM_PARTS = 'snippet,contentDetails,status'

/**
 * Titles YouTube substitutes once the video behind an item is gone. The item
 * itself survives — only the video is unreachable.
 */
const UNAVAILABLE_TITLES: readonly string[] = ['Deleted video', 'Private video']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

function toOptionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

function toThumbnailUrl(thumbnails: unknown): string | undefined {
  const sizes = readRecord(thumbnails)

  if (!sizes) return undefined

  // `medium` (320×180) matches the card; `default` is the fallback.
  return toOptionalText(readRecord(sizes.medium)?.url) ?? toOptionalText(readRecord(sizes.default)?.url)
}

/**
 * A video is unavailable when YouTube marks the item private, or when it has
 * swapped in one of its placeholder titles.
 *
 * The title check is deliberately secondary: it is English-only and could in
 * principle collide with a real video called "Private video", so it only ever
 * runs after the authoritative status check.
 */
function toIsUnavailable(status: unknown, title: string): boolean {
  const privacyStatus = readRecord(status)?.privacyStatus

  if (privacyStatus === 'private' || privacyStatus === 'privacyStatusUnspecified') return true

  return UNAVAILABLE_TITLES.includes(title)
}

/**
 * Maps one playlist-item resource, or returns `null` if it cannot be trusted.
 *
 * Pure. Validates structurally rather than casting — the payload is whatever the
 * network returned. Mirrors `mapPlaylistResource` in `./playlists`.
 *
 * Two fields are load-bearing and their absence drops the item: without `id`
 * there is no React key and no way to move it later, and without a `videoId`
 * there is nothing to link to and nothing to echo back on an update, which the
 * API requires. Every other field has a defined fallback.
 *
 * `snippet.position` is deliberately *not* read into the model: order is the
 * array index. Two representations of order would eventually disagree.
 */
export function mapPlaylistItemResource(raw: unknown): IPlaylistItem | null {
  const resource = readRecord(raw)

  if (!resource) return null

  const id = toOptionalText(resource.id)

  if (!id) return null

  const contentDetails = readRecord(resource.contentDetails)
  const videoId = toOptionalText(contentDetails?.videoId)

  if (!videoId) return null

  const snippet = readRecord(resource.snippet)
  const title = toOptionalText(snippet?.title) ?? ''

  return {
    id,
    videoId,
    title,
    channelTitle: toOptionalText(snippet?.videoOwnerChannelTitle),
    thumbnailUrl: toThumbnailUrl(snippet?.thumbnails),
    isUnavailable: toIsUnavailable(resource.status, title),
  }
}

/** A count is only believable if it is a non-negative finite number. */
function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}

/**
 * Retrieves **every** item in a playlist, in running order.
 *
 * Pages until the last one arrives and returns the complete list, or rejects.
 * Never a partial one: positions are computed against the whole list, so
 * rearranging a half-retrieved playlist would build a move plan against an order
 * that is not the real one and save a wrong result. That is silent corruption,
 * the worst failure this feature could have, and waiting costs one quota unit
 * per fifty videos.
 *
 * `onProgress` is for display only and must never gate correctness.
 *
 * Rejects with `YouTubeError`; a cancellation from `signal` propagates unchanged.
 */
export async function listAllPlaylistItems(
  getAccessToken: () => Promise<string>,
  playlistId: string,
  onProgress?: (retrieved: number, total: number) => void,
  signal?: AbortSignal,
): Promise<IPlaylistItem[]> {
  const items: IPlaylistItem[] = []
  let pageToken: string | undefined

  do {
    const params: Record<string, string> = {
      part: PLAYLIST_ITEM_PARTS,
      playlistId,
      maxResults: String(PLAYLIST_ITEMS_PAGE_SIZE),
    }

    if (pageToken) {
      params.pageToken = pageToken
    }

    const body = readRecord(await youtubeGet(getAccessToken, PLAYLIST_ITEMS_PATH, params, signal))
    const rawItems = Array.isArray(body?.items) ? body.items : []

    for (const raw of rawItems) {
      const item = mapPlaylistItemResource(raw)

      if (item) items.push(item)
    }

    // The API reports the playlist size; fall back to what has actually arrived
    // so progress never claims a total it cannot substantiate.
    const total = Math.max(toCount(readRecord(body?.pageInfo)?.totalResults), items.length)

    onProgress?.(items.length, total)

    pageToken = toOptionalText(body?.nextPageToken)
  } while (pageToken)

  return items
}
