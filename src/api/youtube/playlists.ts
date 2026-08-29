import { youtubeGet, youtubePost } from '@/api/youtube/client'
import { YouTubeError } from '@/api/youtube/errors'
import type { IPlaylist, IPlaylistPage, PlaylistPrivacy } from '@/models/playlist'

/**
 * The API maximum. One request costs the same quota unit whatever this is, so
 * the largest page means the fewest round trips.
 *
 * Lower this temporarily to rehearse pagination against a small library.
 */
export const PLAYLISTS_PAGE_SIZE = 50

const PLAYLISTS_PATH = '/playlists'

/** The three parts covering every field the UI needs, and nothing more. */
const PLAYLIST_PARTS = 'snippet,contentDetails,status'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

/** Missing, blank, or non-string titles collapse to empty, which the UI renders as untitled. */
function toTitle(value: unknown): string {
  return typeof value === 'string' && value.trim() !== '' ? value : ''
}

function toOptionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

function toThumbnailUrl(thumbnails: unknown): string | undefined {
  const sizes = readRecord(thumbnails)

  if (!sizes) return undefined

  // `medium` (320×180) is the smallest size that is not visibly soft in a card.
  return toOptionalText(readRecord(sizes.medium)?.url) ?? toOptionalText(readRecord(sizes.default)?.url)
}

/** A count is only believable if it is a non-negative finite number. */
function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}

/**
 * Anything unrecognised becomes `private`: mislabelling a private playlist as
 * public is the harmful direction to get wrong.
 */
function toPlaylistPrivacy(value: unknown): PlaylistPrivacy {
  if (value === 'public') return 'public'
  if (value === 'unlisted') return 'unlisted'

  return 'private'
}

/**
 * Maps one playlist resource, or returns `null` if it cannot be trusted.
 *
 * Pure. Validates structurally rather than casting — the payload is whatever the
 * network returned, so every level is checked before it is read. The expected
 * shape is documented by `IYouTubePlaylistResource` in `./types`.
 *
 * Only `id` is load-bearing: without one there is no React key and no way to act
 * on the playlist later, so the resource is dropped. Every other field has a
 * defined fallback, so a partial resource still yields a usable playlist.
 */
export function mapPlaylistResource(raw: unknown): IPlaylist | null {
  const resource = readRecord(raw)

  if (!resource || typeof resource.id !== 'string' || resource.id === '') {
    return null
  }

  const snippet = readRecord(resource.snippet)
  const contentDetails = readRecord(resource.contentDetails)
  const status = readRecord(resource.status)

  return {
    id: resource.id,
    title: toTitle(snippet?.title),
    description: toOptionalText(snippet?.description),
    thumbnailUrl: toThumbnailUrl(snippet?.thumbnails),
    itemCount: toCount(contentDetails?.itemCount),
    privacy: toPlaylistPrivacy(status?.privacyStatus),
  }
}

/**
 * Maps a `playlists.list` response into one page.
 *
 * A malformed `items` array yields an empty page rather than throwing: one bad
 * resource must not cost the user the rest of the page.
 */
function mapPlaylistPage(body: unknown): IPlaylistPage {
  const response = readRecord(body)
  const items = Array.isArray(response?.items) ? response.items : []

  const playlists = items.map(mapPlaylistResource).filter((playlist): playlist is IPlaylist => playlist !== null)

  const totalResults = toCount(readRecord(response?.pageInfo)?.totalResults)

  return {
    playlists,
    nextPageToken: toOptionalText(response?.nextPageToken),
    // The API reports the library size; fall back to what this page actually held.
    totalResults: totalResults > 0 ? totalResults : playlists.length,
  }
}

/**
 * Retrieves one page of the playlists owned by the connected account.
 *
 * `mine=true` returns only user-created playlists — auto-generated collections
 * such as Watch Later and Liked Videos are not included, so no filtering of our
 * own is needed.
 *
 * Rejects with `YouTubeError`; a cancellation from `signal` propagates unchanged.
 */
export async function listMyPlaylists(
  getAccessToken: () => Promise<string>,
  pageToken?: string,
  signal?: AbortSignal,
): Promise<IPlaylistPage> {
  const params: Record<string, string> = {
    part: PLAYLIST_PARTS,
    mine: 'true',
    maxResults: String(PLAYLISTS_PAGE_SIZE),
  }

  if (pageToken) {
    params.pageToken = pageToken
  }

  return mapPlaylistPage(await youtubeGet(getAccessToken, PLAYLISTS_PATH, params, signal))
}

export interface ICreatePlaylistInput {
  /** Sent trimmed. What the person typed stays in the form. */
  title: string
  /** Omitted from the request entirely when blank. */
  description?: string
  privacy: PlaylistPrivacy
}

/**
 * Creates a playlist, costing **50 quota units**.
 *
 * `part=snippet,status` because both are being set. Naming a part here is not
 * the hazard it is on an update: this creates a resource, so there is no
 * existing value that an omitted field could blank.
 *
 * A blank description is **omitted entirely** rather than sent as `""` — a
 * playlist with no description and one with an empty description should not be
 * different things.
 *
 * The response goes through the same `mapPlaylistResource` the library uses, so
 * a created playlist and a retrieved one are indistinguishable downstream. A
 * response that cannot be mapped is a failure rather than a half-created
 * playlist: the playlist may well exist, but PlayPick cannot describe it, and
 * claiming success for something it cannot show would be worse than saying so.
 *
 * Rejects with `YouTubeError`; a cancellation propagates unchanged.
 */
export async function createPlaylist(
  getAccessToken: () => Promise<string>,
  input: ICreatePlaylistInput,
  signal?: AbortSignal,
): Promise<IPlaylist> {
  const description = input.description?.trim()

  const body = {
    snippet: {
      title: input.title.trim(),
      ...(description === undefined || description === '' ? {} : { description }),
    },
    status: { privacyStatus: input.privacy },
  }

  const created = mapPlaylistResource(
    await youtubePost(getAccessToken, PLAYLISTS_PATH, { part: 'snippet,status' }, body, signal),
  )

  if (!created) {
    throw new YouTubeError('unknown', 'Created playlist could not be read from the response')
  }

  return created
}
