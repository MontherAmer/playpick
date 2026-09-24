import type { IBuildStep } from './build.interface'

export interface IDuplicatePlan {
  steps: IBuildStep[]
  totalItems: number
  copyableCount: number
  unavailableCount: number
  repeatedCount: number
}
