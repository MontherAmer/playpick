import { ArrowLeft, ListVideo, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/Button'
import { VideoCard } from '@/components/videos/VideoCard'
import { usePlaylistSelection } from '@/features/playlists/usePlaylistSelection'
import { useReorderDraft } from '@/features/reorder/useReorderDraft'
import { PlaylistPicker } from '@/components/playlists/PlaylistPicker'
import type { IPlaylist } from '@/models/playlist'

interface ReorderEditorProps {
  playlist: IPlaylist
  onBack: () => void
}

/**
 * The editing surface for one playlist.
 *
 * Keyed by playlist id at the call site, so choosing another playlist mounts a
 * fresh editor rather than reconciling one draft into another.
 */
function ReorderEditor({ playlist, onBack }: ReorderEditorProps) {
  const { t } = useTranslation()
  const { status, error, draft, loadProgress, retry } = useReorderDraft(playlist.id)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label={t('reorder.back')}>
          {/* Mirrored in Arabic: a back arrow's meaning *is* directional. */}
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        </Button>

        <div className="min-w-0">
          <h2 dir="auto" className="truncate text-lg font-semibold">
            {playlist.title}
          </h2>

          <p className="text-xs text-muted-foreground">
            {t('playlist.videoCount', { count: status === 'ready' ? draft.length : playlist.itemCount })}
          </p>
        </div>
      </div>

      {status === 'loading' && (
        <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {loadProgress
            ? t('reorder.loading', { retrieved: loadProgress.retrieved, total: loadProgress.total })
            : t('common.loading')}
        </p>
      )}

      {status === 'failed' && error !== null && <ErrorState code={error} onRetry={retry} />}

      {status === 'ready' && draft.length === 0 && <EmptyState icon={ListVideo} title={t('reorder.empty')} />}

      {status === 'ready' && draft.length > 0 && (
        <ol className="flex flex-col gap-2">
          {draft.map((item, index) => (
            <li key={item.id}>
              <VideoCard item={item} position={index + 1} />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/**
 * Reorder Playlist: choose one of your playlists, then rearrange it.
 *
 * Deliberately thin — composition, not logic. The draft lives in
 * `useReorderDraft`, and selection reuses the surface feature 001 built for
 * exactly this, rather than a second tool-specific picker.
 */
export function ReorderPlaylistPage() {
  const { t } = useTranslation()
  const { selected, select, clear } = usePlaylistSelection()

  if (selected) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <ReorderEditor key={selected.id} playlist={selected} onBack={clear} />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('reorder.title')}</h1>

        <p className="mt-1 text-sm text-muted-foreground sm:text-base">{t('reorder.selectFirst')}</p>
      </div>

      <PlaylistPicker onSelect={select} />
    </div>
  )
}
