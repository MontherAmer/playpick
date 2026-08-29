import { youtubeGet } from '@/api/youtube/client'

/** The API maximum number of ids per request. One unit covers all fifty. */
export const VIDEOS_BATCH_SIZE = 50

const VIDEOS_PATH = '/videos'

/** ISO-8601 durations, as YouTube emits them: `PT1H2M3S`, `PT4M13S`, `PT45S`. */
const ISO_DURATION = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

/**
 * Parses an ISO-8601 duration to whole seconds.
 *
 * Returns `undefined` rather than `0` for anything unparseable: zero would
 * render as "0:00" and claim something false about the video, where absence
 * simply draws no badge.
 *
 * Pure and exported so it can be exercised directly.
 */
export function parseIsoDuration(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined

  const match = ISO_DURATION.exec(value)

  if (!match) return undefined

  const [, days, hours, minutes, seconds] = match

  // `PT` alone is well-formed but carries no components; it is not a duration.
  if (!days && !hours && !minutes && !seconds) return undefined

  return Number(days ?? 0) * 86_400 + Number(hours ?? 0) * 3_600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0)
}

function chunk<T>(values: T[], size: number): T[][] {
  const batches: T[][] = []

  for (let index = 0; index < values.length; index += size) {
    batches.push(values.slice(index, index + size))
  }

  return batches
}

/**
 * Retrieves durations for the given videos, keyed by video id.
 *
 * Costs one quota unit per fifty ids — negligible beside the fifty units a
 * single reorder move costs. Ids are de-duplicated first, so the same video
 * appearing twice in a playlist is looked up once.
 *
 * **Decorative.** The caller must not let a rejection here fail the screen or
 * block rearranging: a missing duration means no badge, nothing more. This is
 * the one call in the feature allowed to fail quietly, and only because nothing
 * depends on it.
 *
 * Rejects with `YouTubeError`; a cancellation from `signal` propagates unchanged.
 */
export async function listVideoDurations(
  getAccessToken: () => Promise<string>,
  videoIds: string[],
  signal?: AbortSignal,
): Promise<Map<string, number>> {
  const durations = new Map<string, number>()
  const uniqueIds = [...new Set(videoIds)]

  for (const batch of chunk(uniqueIds, VIDEOS_BATCH_SIZE)) {
    const body = readRecord(
      await youtubeGet(
        getAccessToken,
        VIDEOS_PATH,
        { part: 'contentDetails', id: batch.join(','), maxResults: String(VIDEOS_BATCH_SIZE) },
        signal,
      ),
    )

    const items = Array.isArray(body?.items) ? body.items : []

    for (const raw of items) {
      const resource = readRecord(raw)
      const id = resource?.id
      const seconds = parseIsoDuration(readRecord(resource?.contentDetails)?.duration)

      if (typeof id === 'string' && seconds !== undefined) {
        durations.set(id, seconds)
      }
    }
  }

  return durations
}
