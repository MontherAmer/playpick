import type { IVideoDetails } from '@/api/youtube/resources'
import type { IVideo } from '@/models/copy.interface'
import type {
  IRenamePattern,
  IRenamePreviewRow,
  IRenameStep,
  RenamePresetId,
} from '@/models/rename.interface'

import { RENAME_PRESETS, YOUTUBE_TITLE_MAX_LENGTH } from './rename.constants'

function clampInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum

  return Math.min(maximum, Math.max(minimum, Math.trunc(value)))
}

export function normalizeRenamePattern(pattern: IRenamePattern): IRenamePattern {
  return {
    ...pattern,
    startAt: clampInteger(pattern.startAt, 0, 9_999),
    step: clampInteger(pattern.step, 1, 100),
    padding: clampInteger(pattern.padding, 1, 6),
  }
}

export function formatRenameNumber(value: number, padding: number): string {
  return String(Math.max(0, value)).padStart(padding, '0')
}

export function buildRenameLabel({
  title,
  index,
  total,
  pattern,
}: {
  title: string
  index: number
  total: number
  pattern: IRenamePattern
}): string {
  const normalized = normalizeRenamePattern(pattern)
  const sequenceIndex =
    normalized.direction === 'desc' ? total - 1 - index : index
  const number = formatRenameNumber(
    normalized.startAt + sequenceIndex * normalized.step,
    normalized.padding,
  )
  const prefix = normalized.prefix.trim()
  const originalTitle = title.trim()
  const suffix = normalized.suffix
  const separator = normalized.separator
  const head = prefix ? `${prefix} ${number}` : number
  const followingParts = [
    ...(normalized.preserveOriginalTitle && originalTitle ? [originalTitle] : []),
    ...(suffix ? [suffix] : []),
  ]
  const label =
    followingParts.length > 0
      ? `${head}${separator}${followingParts.join(separator)}`
      : prefix
        ? `${prefix}${separator}${number}`
        : number

  return label.trim().slice(0, YOUTUBE_TITLE_MAX_LENGTH)
}

export function getActiveRenamePreset(
  pattern: IRenamePattern,
): RenamePresetId | null {
  const normalized = normalizeRenamePattern(pattern)

  for (const [presetId, preset] of Object.entries(RENAME_PRESETS) as [
    RenamePresetId,
    IRenamePattern,
  ][]) {
    if (
      normalized.prefix === preset.prefix &&
      normalized.suffix === preset.suffix &&
      normalized.separator === preset.separator &&
      normalized.startAt === preset.startAt &&
      normalized.step === preset.step &&
      normalized.padding === preset.padding &&
      normalized.direction === preset.direction &&
      normalized.preserveOriginalTitle === preset.preserveOriginalTitle
    ) {
      return presetId
    }
  }

  return null
}

export function buildRenamePreview({
  videos,
  pattern,
  channelId,
  detailsByVideoId,
}: {
  videos: readonly IVideo[]
  pattern: IRenamePattern
  channelId: string | null
  detailsByVideoId: ReadonlyMap<string, IVideoDetails>
}): IRenamePreviewRow[] {
  return videos.map((video, index) => {
    const details = detailsByVideoId.get(video.videoId)
    const isOwned = Boolean(channelId && details?.channelId === channelId)
    const label = buildRenameLabel({
      title: video.title,
      index,
      total: videos.length,
      pattern,
    })

    return {
      video,
      label,
      isOwned,
      canApply:
        isOwned &&
        !video.isUnavailable &&
        Boolean(details?.categoryId) &&
        label.length > 0 &&
        label !== video.title,
    }
  })
}

export function buildRenamePlan({
  rows,
  detailsByVideoId,
}: {
  rows: readonly IRenamePreviewRow[]
  detailsByVideoId: ReadonlyMap<string, IVideoDetails>
}): IRenameStep[] {
  return rows.flatMap((row) => {
    const details = detailsByVideoId.get(row.video.videoId)

    if (!row.canApply || !details?.categoryId) return []

    return [
      {
        videoId: row.video.videoId,
        title: row.label,
        description: details.description,
        categoryId: details.categoryId,
        tags: details.tags,
      },
    ]
  })
}
