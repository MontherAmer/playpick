import { Gauge, Info, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/Button'
import type { IDuplicateSummary } from '@/models/duplicate'
import type { IPlaylist } from '@/models/playlist'
import { cn } from '@/utils/cn'

interface DuplicateSourceSummaryProps {
  source: IPlaylist
  summary: IDuplicateSummary
  onChangeSource: () => void
  disabled?: boolean
}

/**
 * What was chosen, and what copying it will produce.
 *
 * Sits above the fields so the decision reads top to bottom: this playlist, this
 * many videos, into a new one called this.
 *
 * **The source is named in the reassurance, not referred to generically.** A
 * tool called "Duplicate" reasonably leads people to wonder what happens to the
 * original, and the answer has to be visible before they commit, not after.
 */
export function DuplicateSourceSummary({
  source,
  summary,
  onChangeSource,
  disabled = false,
}: DuplicateSourceSummaryProps) {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('duplicate.source')}
      className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('duplicate.source')}</p>

          <p dir="auto" className="truncate font-semibold">
            {source.title}
          </p>

          <p className="text-sm text-muted-foreground tabular-nums">
            {t('duplicate.videoCount', { count: summary.totalItems })}
          </p>
        </div>

        <Button variant="outline" onClick={onChangeSource} disabled={disabled}>
          {t('duplicate.changeSource')}
        </Button>
      </div>

      {summary.isLoading && (
        <p role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          <span>
            {t('duplicate.counting')} {t('duplicate.countingHint')}
          </span>
        </p>
      )}

      {/* Always shown, and sharpened when copying this playlist would consume
          most of the day's allowance for everyone using this deployment. Never
          blocking: PlayPick cannot see the remaining allowance, so refusing
          would mean refusing on a guess. */}
      <p
        className={cn(
          'inline-flex items-start gap-2 rounded-lg border p-3 text-sm',
          summary.isLargeDuplicate ? 'border-destructive/30 bg-destructive/5' : 'bg-muted/40 text-muted-foreground',
        )}>
        <Gauge className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {summary.isLargeDuplicate ? t('duplicate.costLarge') : t('duplicate.cost')}
      </p>

      {/* The one expectation a "duplicate" screen has to correct explicitly. */}
      <p className="inline-flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {t('duplicate.keepsSource', { playlist: source.title })}
      </p>
    </section>
  )
}
