import type { JSX } from 'react'

import { Image } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CLEANER_KEEP_RULES } from '@/features/cleaner/cleaner.constants'
import { cn } from '@/lib/cn'
import type { CleanerKeepRule, ICleanerDuplicateGroup } from '@/models/cleaner.interface'

interface ICleanerDuplicateListProps {
  groups: readonly ICleanerDuplicateGroup[]
  keepRules: Readonly<Record<string, CleanerKeepRule>>
  onKeepRuleChange: (videoId: string, rule: CleanerKeepRule) => void
}

export function CleanerDuplicateList({
  groups,
  keepRules,
  onKeepRuleChange,
}: ICleanerDuplicateListProps): JSX.Element {
  const { t } = useTranslation()

  if (groups.length === 0) {
    return (
      <p className="p-6 text-sm text-muted-foreground">{t('cleaner.duplicates.empty')}</p>
    )
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const selectedRule = keepRules[group.videoId] ?? 'first'

        return (
          <div key={group.videoId} className="rounded-lg border border-border p-4">
            <div className="flex gap-3">
              {group.thumbnailUrl ? (
                <img
                  src={group.thumbnailUrl}
                  alt=""
                  className="h-14 w-24 shrink-0 rounded object-cover"
                />
              ) : (
                <span className="grid h-14 w-24 shrink-0 place-items-center rounded bg-muted">
                  <Image className="size-4 text-muted-foreground" />
                </span>
              )}
              <div className="min-w-0">
                <b className="block text-sm">{group.title || t('copy.untitled')}</b>
                <p className="text-xs text-muted-foreground">
                  {t('cleaner.duplicates.appears', { count: group.occurrences.length })}
                </p>
              </div>
            </div>
            <div
              role="radiogroup"
              aria-label={t('cleaner.duplicates.keepLabel', {
                title: group.title || t('copy.untitled'),
              })}
              className="mt-3 grid gap-2 sm:grid-cols-2"
            >
              {CLEANER_KEEP_RULES.map((rule) => (
                <button
                  key={rule}
                  type="button"
                  role="radio"
                  aria-checked={selectedRule === rule}
                  onClick={() => onKeepRuleChange(group.videoId, rule)}
                  className={cn(
                    'flex items-center gap-2 rounded-md border p-3 text-start text-sm',
                    selectedRule === rule
                      ? 'border-primary bg-primary-soft'
                      : 'border-border',
                  )}
                >
                  <span
                    className={cn(
                      'size-4 shrink-0 rounded-full border',
                      selectedRule === rule ? 'border-4 border-primary' : 'border-border',
                    )}
                  />
                  {t(`cleaner.duplicates.keep.${rule}`)}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
