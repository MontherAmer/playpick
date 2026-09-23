import { useState } from 'react'

import type { IBuildEntry, IBuildStep } from '@/models/build.interface'
import type { IVideo } from '@/models/copy.interface'

function markDuplicates(entries: readonly IBuildEntry[]): IBuildEntry[] {
  const seenVideoIds = new Set<string>()

  return entries.map((entry) => {
    const isDuplicate = seenVideoIds.has(entry.video.videoId)
    seenVideoIds.add(entry.video.videoId)

    return { ...entry, isDuplicate }
  })
}

export function useBuildDraft() {
  const [entries, setEntries] = useState<IBuildEntry[]>([])
  const [includeDuplicates, setIncludeDuplicates] = useState(false)

  const duplicateCount = entries.filter((entry) => entry.isDuplicate).length
  const plan: IBuildStep[] = entries
    .filter((entry) => includeDuplicates || !entry.isDuplicate)
    .map((entry) => ({ key: entry.key, videoId: entry.video.videoId }))

  const addVideos = (videos: readonly IVideo[]): void => {
    setEntries((current) => {
      const seenVideoIds = new Set(current.map((entry) => entry.video.videoId))
      const additions = videos.map((video) => {
        const isDuplicate = seenVideoIds.has(video.videoId)
        seenVideoIds.add(video.videoId)

        return {
          key: `${video.videoId}-${crypto.randomUUID()}`,
          video,
          isDuplicate,
        }
      })

      return [...current, ...additions]
    })
  }

  const remove = (key: string): void => {
    setEntries((current) => markDuplicates(current.filter((entry) => entry.key !== key)))
  }

  const move = (fromIndex: number, toIndex: number): void => {
    setEntries((current) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        fromIndex >= current.length ||
        toIndex < 0 ||
        toIndex >= current.length
      ) {
        return current
      }

      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)

      if (!moved) return current

      next.splice(toIndex, 0, moved)

      return markDuplicates(next)
    })
  }

  const discard = (): void => {
    setEntries([])
    setIncludeDuplicates(false)
  }

  return {
    entries,
    includeDuplicates,
    duplicateCount,
    plan,
    additionCount: plan.length,
    setIncludeDuplicates,
    addVideos,
    remove,
    move,
    discard,
  }
}
