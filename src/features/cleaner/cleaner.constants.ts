import type { CleanerKeepRule, CleanerStatKey } from '@/models/cleaner.interface'

export const CLEANER_KEEP_RULES: readonly CleanerKeepRule[] = ['first', 'latest']

export const CLEANER_STAT_KEYS: readonly CleanerStatKey[] = [
  'duplicateVideos',
  'unavailableVideos',
  'deletedOrPrivate',
]

export const CLEANER_STAT_TONES: Record<CleanerStatKey, string> = {
  duplicateVideos: 'text-amber-600 dark:text-amber-400',
  unavailableVideos: 'text-destructive',
  deletedOrPrivate: 'text-muted-foreground',
}
