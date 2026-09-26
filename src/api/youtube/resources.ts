import type { IPlaylist, IVideo, PlaylistPrivacy } from '@/models/copy.interface'

import { youtubeDelete, youtubeGet, youtubePost, youtubePut } from './client'
import { YouTubeError } from './errors'

const PAGE_SIZE = '50'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

function readText(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

function readCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0
}

function readThumbnail(value: unknown): string | undefined {
  const thumbnails = readRecord(value)

  return (
    readText(readRecord(thumbnails?.medium)?.url) ??
    readText(readRecord(thumbnails?.default)?.url)
  )
}

function readPrivacy(value: unknown): PlaylistPrivacy {
  return value === 'public' || value === 'unlisted' ? value : 'private'
}

function mapPlaylist(value: unknown): IPlaylist | null {
  const resource = readRecord(value)
  const id = readText(resource?.id)

  if (!resource || !id) return null

  const snippet = readRecord(resource.snippet)

  return {
    id,
    title: readText(snippet?.title) ?? '',
    description: readText(snippet?.description),
    thumbnailUrl: readThumbnail(snippet?.thumbnails),
    itemCount: readCount(readRecord(resource.contentDetails)?.itemCount),
    privacy: readPrivacy(readRecord(resource.status)?.privacyStatus),
  }
}

function mapPlaylistItem(value: unknown): IVideo | null {
  const resource = readRecord(value)
  const id = readText(resource?.id)
  const snippet = readRecord(resource?.snippet)
  const videoId =
    readText(readRecord(resource?.contentDetails)?.videoId) ??
    readText(readRecord(snippet?.resourceId)?.videoId)

  if (!id || !videoId) return null

  const title = readText(snippet?.title) ?? ''
  const privacyStatus = readText(readRecord(resource?.status)?.privacyStatus)

  return {
    id,
    videoId,
    title,
    channelTitle: readText(snippet?.videoOwnerChannelTitle) ?? readText(snippet?.channelTitle),
    thumbnailUrl: readThumbnail(snippet?.thumbnails),
    dateAdded: readText(snippet?.publishedAt),
    isUnavailable:
      privacyStatus === 'private' || ['Deleted video', 'Private video'].includes(title),
  }
}

function mapVideo(value: unknown): IVideo | null {
  const resource = readRecord(value)
  const idValue = resource?.id
  const videoId =
    readText(idValue) ?? (isRecord(idValue) ? readText(idValue.videoId) : undefined)
  const snippet = readRecord(resource?.snippet)

  if (!videoId) return null

  return {
    id: videoId,
    videoId,
    title: readText(snippet?.title) ?? '',
    channelTitle: readText(snippet?.channelTitle),
    thumbnailUrl: readThumbnail(snippet?.thumbnails),
    isUnavailable: false,
  }
}

function readItems(body: unknown): unknown[] {
  const response = readRecord(body)

  return Array.isArray(response?.items) ? response.items : []
}

function readNextPageToken(body: unknown): string | undefined {
  return readText(readRecord(body)?.nextPageToken)
}

export async function listMyPlaylists(
  getAccessToken: () => Promise<string>,
  signal?: AbortSignal,
): Promise<IPlaylist[]> {
  const playlists: IPlaylist[] = []
  let pageToken: string | undefined

  do {
    const body = await youtubeGet(
      getAccessToken,
      '/playlists',
      {
        part: 'snippet,contentDetails,status',
        mine: 'true',
        maxResults: PAGE_SIZE,
        ...(pageToken ? { pageToken } : {}),
      },
      signal,
    )

    playlists.push(
      ...readItems(body)
        .map(mapPlaylist)
        .filter((playlist): playlist is IPlaylist => playlist !== null),
    )
    pageToken = readNextPageToken(body)
  } while (pageToken)

  return playlists
}

export async function createPlaylist(
  getAccessToken: () => Promise<string>,
  {
    title,
    description,
    privacy,
  }: {
    title: string
    description?: string
    privacy: PlaylistPrivacy
  },
): Promise<IPlaylist> {
  const trimmedDescription = description?.trim()
  const body = await youtubePost(
    getAccessToken,
    '/playlists',
    { part: 'snippet,status' },
    {
      snippet: {
        title: title.trim(),
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
      },
      status: { privacyStatus: privacy },
    },
  )
  const playlist = mapPlaylist(body)

  if (!playlist) throw new YouTubeError('unknown')

  return playlist
}

export async function getPlaylist(
  getAccessToken: () => Promise<string>,
  playlistId: string,
  signal?: AbortSignal,
): Promise<IPlaylist> {
  const body = await youtubeGet(
    getAccessToken,
    '/playlists',
    { part: 'snippet,contentDetails,status', id: playlistId, maxResults: '1' },
    signal,
  )
  const playlist = mapPlaylist(readItems(body)[0])

  if (!playlist) throw new YouTubeError('notFound')

  return playlist
}

export async function listPlaylistVideos(
  getAccessToken: () => Promise<string>,
  playlistId: string,
  signal?: AbortSignal,
): Promise<IVideo[]> {
  const videos: IVideo[] = []
  let pageToken: string | undefined

  do {
    const body = await youtubeGet(
      getAccessToken,
      '/playlistItems',
      {
        part: 'snippet,contentDetails,status',
        playlistId,
        maxResults: PAGE_SIZE,
        ...(pageToken ? { pageToken } : {}),
      },
      signal,
    )

    videos.push(
      ...readItems(body)
        .map(mapPlaylistItem)
        .filter((video): video is IVideo => video !== null),
    )
    pageToken = readNextPageToken(body)
  } while (pageToken)

  return videos
}

export async function searchVideos(
  getAccessToken: () => Promise<string>,
  query: string,
  signal?: AbortSignal,
): Promise<IVideo[]> {
  const body = await youtubeGet(
    getAccessToken,
    '/search',
    {
      part: 'snippet',
      type: 'video',
      q: query,
      maxResults: '25',
      safeSearch: 'moderate',
    },
    signal,
  )

  return readItems(body)
    .map(mapVideo)
    .filter((video): video is IVideo => video !== null)
}

export async function getVideos(
  getAccessToken: () => Promise<string>,
  videoIds: readonly string[],
  signal?: AbortSignal,
): Promise<IVideo[]> {
  if (videoIds.length === 0) return []

  const body = await youtubeGet(
    getAccessToken,
    '/videos',
    { part: 'snippet,status', id: videoIds.join(','), maxResults: PAGE_SIZE },
    signal,
  )

  return readItems(body)
    .map(mapVideo)
    .filter((video): video is IVideo => video !== null)
}

export async function addPlaylistVideo(
  getAccessToken: () => Promise<string>,
  playlistId: string,
  videoId: string,
): Promise<void> {
  await youtubePost(
    getAccessToken,
    '/playlistItems',
    { part: 'snippet' },
    {
      snippet: {
        playlistId,
        resourceId: { kind: 'youtube#video', videoId },
      },
    },
  )
}

export async function removePlaylistVideo(
  getAccessToken: () => Promise<string>,
  playlistItemId: string,
): Promise<void> {
  await youtubeDelete(getAccessToken, '/playlistItems', { id: playlistItemId })
}

export async function updatePlaylistVideoPosition(
  getAccessToken: () => Promise<string>,
  {
    playlistItemId,
    playlistId,
    videoId,
    position,
  }: {
    playlistItemId: string
    playlistId: string
    videoId: string
    position: number
  },
): Promise<void> {
  await youtubePut(
    getAccessToken,
    '/playlistItems',
    { part: 'snippet' },
    {
      id: playlistItemId,
      snippet: {
        playlistId,
        resourceId: { kind: 'youtube#video', videoId },
        position,
      },
    },
  )
}
