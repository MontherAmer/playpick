import {
  Ban,
  CloudOff,
  FileWarning,
  KeyRound,
  Layers,
  ListX,
  PackageOpen,
  RotateCcw,
  ShieldAlert,
  TriangleAlert,
  WifiOff,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { YouTubeErrorCode } from '@/api/youtube/errors'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

/**
 * One icon per code, so the failures stay distinguishable at a glance and not
 * by wording alone. Exhaustive by construction: a new code will not compile
 * until it is given an icon here and a message in both locale files.
 */
const ICONS: Record<YouTubeErrorCode, LucideIcon> = {
  network: WifiOff,
  authExpired: KeyRound,
  quotaExceeded: Ban,
  apiNotEnabled: Wrench,
  insufficientPermissions: ShieldAlert,
  notFound: ListX,
  playlistFull: PackageOpen,
  // Distinct from `playlistFull`: too many playlists, not too many videos.
  playlistLimitReached: Layers,
  invalidPlaylistDetails: FileWarning,
  service: CloudOff,
  unknown: TriangleAlert,
}

interface ErrorStateProps {
  code: YouTubeErrorCode
  /** Omitted where re-attempting cannot help; the message then stands alone. */
  onRetry?: () => void
  className?: string
}

/**
 * A failed retrieval, explained in terms the user can act on.
 *
 * The message comes from `errors.youtube.<code>` and nothing else: the HTTP
 * status, Google's `error.message`, and the request itself never reach the
 * screen, so no token or raw payload can leak through this component (FR-021).
 */
export function ErrorState({ code, onRetry, className }: ErrorStateProps) {
  const { t } = useTranslation()
  const Icon = ICONS[code]

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center',
        className,
      )}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <Icon className="h-6 w-6 text-destructive" aria-hidden="true" />
      </div>

      <p className="max-w-sm font-semibold">{t(`errors.youtube.${code}`)}</p>

      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
