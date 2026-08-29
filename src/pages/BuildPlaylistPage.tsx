import { CheckCircle2, ExternalLink } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BuildDraftColumn } from '@/components/build/BuildDraftColumn'
import { NewPlaylistFields } from '@/components/build/NewPlaylistFields'
import { SourcePlaylistColumn } from '@/components/build/SourcePlaylistColumn'
import { SourceVideosColumn } from '@/components/build/SourceVideosColumn'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ProgressDialog } from '@/components/common/ProgressDialog'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { useBuildDraft } from '@/features/build/useBuildDraft'
import { useBuildSave } from '@/features/build/useBuildSave'
import { useSourceItems } from '@/features/build/useSourceItems'
import { isDraftSubmittable } from '@/features/create/validatePlaylistDraft'
import { usePlaylistSelection } from '@/features/playlists/usePlaylistSelection'
import type { IBuildDestination } from '@/models/build'
import { EMPTY_DRAFT, type IPlaylistDraft } from '@/models/playlistDraft'

function playlistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${playlistId}`
}

/** No destination is chosen yet, so nothing is in it. */
const NO_DESTINATION_VIDEOS: ReadonlySet<string> = new Set()

/**
 * Build Playlist: gather videos from a playlist, then turn them into a new one.
 *
 * Composition and wiring only. The three columns own their own presentation,
 * the draft owns what has been gathered, and the save owns the write — this
 * page holds none of it, because a page that contains an entire feature stops
 * being reviewable.
 */
export function BuildPlaylistPage() {
  const { t } = useTranslation()

  const source = usePlaylistSelection()
  // Remembers what has already arrived, so returning to a source is free.
  const sourceItems = useSourceItems(source.selectedId)

  const draft = useBuildDraft(NO_DESTINATION_VIDEOS)
  const save = useBuildSave()

  const [newPlaylist, setNewPlaylist] = useState<IPlaylistDraft>(EMPTY_DRAFT)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDiscarding, setIsDiscarding] = useState(false)

  const destination = useMemo<IBuildDestination>(() => ({ kind: 'new', draft: newPlaylist }), [newPlaylist])

  const isSaving = save.status === 'creating' || save.status === 'adding'
  const canSave = draft.additionCount > 0 && isDraftSubmittable(newPlaylist)

  const startOver = useCallback(() => {
    save.reset()
    draft.discard()
    setNewPlaylist(EMPTY_DRAFT)
  }, [save, draft])

  if (save.status === 'succeeded' && save.targetPlaylist) {
    const target = save.targetPlaylist

    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-brand/30 bg-brand-muted/40 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
            <CheckCircle2 className="h-6 w-6 text-brand" aria-hidden="true" />
          </div>

          <p className="font-semibold">{t('build.success.title')}</p>

          <p dir="auto" className="max-w-md text-sm text-muted-foreground">
            {t('build.success.description', { count: save.completed, playlist: target.title })}
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <a
              href={playlistUrl(target.id)}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ variant: 'brand' })}>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {t('common.openOnYouTube')}
            </a>

            <Button variant="outline" onClick={startOver}>
              {t('build.success.another')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('build.title')}</h1>

        <p className="mt-1 text-sm text-muted-foreground sm:text-base">{t('build.subtitle')}</p>
      </div>

      {/* `minmax(0, …)` on every track, not bare widths: a grid item defaults to
          `min-width: auto`, so an intrinsically wide child would widen its track
          and scroll the whole page sideways at 320px. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,380px)]">
        <SourcePlaylistColumn selectedId={source.selectedId} onSelect={source.select} />

        <SourceVideosColumn
          playlist={source.selected}
          state={sourceItems}
          isInDraft={draft.containsVideo}
          onAdd={(item) => {
            if (source.selectedId) draft.add(item, source.selectedId)
          }}
          onAddMany={(items) => {
            if (source.selectedId) draft.addMany(items, source.selectedId)
          }}
        />

        <BuildDraftColumn
          entries={draft.entries}
          duplicateFlags={draft.duplicateFlags}
          additionCount={draft.additionCount}
          destination={
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">{t('build.destination')}</h3>

              <NewPlaylistFields draft={newPlaylist} onChange={setNewPlaylist} disabled={isSaving} />
            </div>
          }
          canSave={canSave}
          isSaving={isSaving}
          onDiscard={() => {
            setIsDiscarding(true)
          }}
          onSave={() => {
            setIsConfirming(true)
          }}
        />
      </div>

      <ProgressDialog open={isSaving} completed={save.completed} total={save.total} />

      {/* Nothing is sent until this is accepted. It names the count, the
          playlist, that it is about to be created, and what it costs. */}
      <ConfirmDialog
        open={isConfirming}
        title={t('build.confirm.new', { count: draft.additionCount, playlist: newPlaylist.title.trim() })}
        message={t('build.confirm.cost')}
        confirmLabel={t('build.confirm.action')}
        onCancel={() => {
          setIsConfirming(false)
        }}
        onConfirm={() => {
          setIsConfirming(false)
          void save.save(draft.plan, destination)
        }}
      />

      <ConfirmDialog
        open={isDiscarding}
        title={t('build.discard.title')}
        message={t('build.discard.message')}
        confirmLabel={t('build.discard.action')}
        onCancel={() => {
          setIsDiscarding(false)
        }}
        onConfirm={() => {
          setIsDiscarding(false)
          draft.discard()
        }}
      />
    </div>
  )
}
