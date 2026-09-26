import type { IRenamePattern, RenamePresetId } from '@/models/rename.interface'

export const YOUTUBE_TITLE_MAX_LENGTH = 100

export const DEFAULT_RENAME_PATTERN: IRenamePattern = {
  prefix: 'Lesson',
  suffix: '',
  separator: ' — ',
  startAt: 1,
  step: 1,
  padding: 2,
  direction: 'asc',
  preserveOriginalTitle: true,
}

export const RENAME_PRESETS: Record<RenamePresetId, IRenamePattern> = {
  numberedTitle: {
    prefix: '',
    suffix: '',
    separator: ' - ',
    startAt: 1,
    step: 1,
    padding: 2,
    direction: 'asc',
    preserveOriginalTitle: true,
  },
  lessonNumber: {
    prefix: 'Lesson',
    suffix: '',
    separator: ' — ',
    startAt: 1,
    step: 1,
    padding: 2,
    direction: 'asc',
    preserveOriginalTitle: true,
  },
  partTitle: {
    prefix: 'Part',
    suffix: '',
    separator: ': ',
    startAt: 1,
    step: 1,
    padding: 1,
    direction: 'asc',
    preserveOriginalTitle: true,
  },
}
