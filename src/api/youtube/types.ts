/**
 * Minimal hand-written declarations for the parts of the YouTube Data API v3
 * this app consumes, so no generated-client dependency is needed.
 * https://developers.google.com/youtube/v3/docs/playlists
 *
 * These describe a *well-formed* response. Payloads are parsed as `unknown` and
 * narrowed against these shapes by the mapper — nothing here is guaranteed by
 * the network, so treat them as the target of validation, not as a promise.
 *
 * Internal to `src/api/youtube/`. Nothing outside this directory may import
 * them: the rest of the app works with the domain models in `@/models/playlist`.
 */

export interface IYouTubeThumbnail {
  url: string
  width?: number
  height?: number
}

/**
 * Every size is optional and the whole object may be absent — a playlist with
 * no videos commonly has no artwork at all.
 */
export interface IYouTubeThumbnails {
  default?: IYouTubeThumbnail
  medium?: IYouTubeThumbnail
  high?: IYouTubeThumbnail
  standard?: IYouTubeThumbnail
  maxres?: IYouTubeThumbnail
}

export interface IYouTubePlaylistSnippet {
  title?: string
  description?: string
  channelTitle?: string
  thumbnails?: IYouTubeThumbnails
}

export interface IYouTubePlaylistContentDetails {
  itemCount?: number
}

export interface IYouTubePlaylistStatus {
  /**
   * Documented as `public`, `unlisted`, or `private`, but deliberately typed
   * open: an unrecognised value must narrow to the safest option rather than
   * fail a type assertion.
   */
  privacyStatus?: string
}

/**
 * A playlist resource. The parts are optional because each is present only when
 * requested in `part` — a request that omits `status` gets no `status` object.
 */
export interface IYouTubePlaylistResource {
  id: string
  snippet?: IYouTubePlaylistSnippet
  contentDetails?: IYouTubePlaylistContentDetails
  status?: IYouTubePlaylistStatus
}

export interface IYouTubePageInfo {
  totalResults?: number
  resultsPerPage?: number
}

export interface IYouTubePlaylistListResponse {
  /** Absent, not empty, when the account has no playlists. */
  items?: IYouTubePlaylistResource[]
  /** Absent once the last page has been reached. */
  nextPageToken?: string
  pageInfo?: IYouTubePageInfo
}

export interface IYouTubeErrorDetail {
  /** Discriminates the two different 403s: quota exhaustion vs. permissions. */
  reason?: string
  domain?: string
}

/** Google's standard error envelope. Never rendered to the user. */
export interface IYouTubeErrorResponse {
  error?: {
    code?: number
    message?: string
    errors?: IYouTubeErrorDetail[]
  }
}

/**
 * The video a playlist item points at. `kind` is always `youtube#video` for the
 * items this app handles, and must be echoed back on an update.
 */
export interface IYouTubeResourceId {
  kind?: string
  videoId?: string
}

export interface IYouTubePlaylistItemSnippet {
  title?: string
  /** The channel that uploaded the video — not the playlist owner's channel. */
  videoOwnerChannelTitle?: string
  thumbnails?: IYouTubeThumbnails
  /** Zero-based. Read as a sanity check on page ordering; never stored. */
  position?: number
  resourceId?: IYouTubeResourceId
}

export interface IYouTubePlaylistItemContentDetails {
  videoId?: string
  videoPublishedAt?: string
}

export interface IYouTubePlaylistItemStatus {
  /** `private` here means the underlying video is private or deleted. */
  privacyStatus?: string
}

export interface IYouTubePlaylistItemResource {
  id: string
  snippet?: IYouTubePlaylistItemSnippet
  contentDetails?: IYouTubePlaylistItemContentDetails
  status?: IYouTubePlaylistItemStatus
}

export interface IYouTubePlaylistItemListResponse {
  items?: IYouTubePlaylistItemResource[]
  nextPageToken?: string
  pageInfo?: IYouTubePageInfo
}

export interface IYouTubeVideoContentDetails {
  /** ISO-8601, e.g. `PT4M13S`. Absent for a video the caller cannot see. */
  duration?: string
}

export interface IYouTubeVideoResource {
  id: string
  contentDetails?: IYouTubeVideoContentDetails
}

export interface IYouTubeVideoListResponse {
  items?: IYouTubeVideoResource[]
}
