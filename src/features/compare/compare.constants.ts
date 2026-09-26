import type { CompareFilter } from '@/models/compare.interface'

export const COMPARE_FILTERS: readonly CompareFilter[] = ['onlyA', 'both', 'onlyB']

export const COMPARE_STAT_KEYS = [
  'totalA',
  'totalB',
  'shared',
  'onlyA',
  'onlyB',
] as const
