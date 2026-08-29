import { CheckCircle2, ExternalLink } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { YouTubeErrorCode } from '@/api/youtube/errors'
import { ErrorState } from '@/components/common/ErrorState'
import { PlaylistForm } from '@/components/create/PlaylistForm'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/buttonStyles'
import { useCreatePlaylist } from '@/features/create/useCreatePlaylist'
import { isDraftSubmittable, validatePlaylistDraft } from '@/features/create/validatePlaylistDraft'
import { EMPTY_DRAFT, type IPlaylistDraft } from '@/models/playlistDraft'

function playlistUrl(playlistId: string): string {
  return `https://www.youtube.com/playlist?list=${playlistId}`
}

/**
 * Failures that another attempt cannot fix: the daily allowance is spent, the
 * account holds all the playlists YouTube allows, or this deployment was never
 * configured to reach the API. Offering a retry here would only invite the
 * person to spend their time proving the same thing twice.
 */
const NO_RETRY: readonly YouTubeErrorCode[] = ['quotaExceeded', 'playlistLimitReached', 'apiNotEnabled']

/**
 * Create Playlist: three fields, one explicit submit, one new playlist.
 *
 * Thin by design — the draft is this page's state, validation is a pure call,
 * and the creation is the hook's.
 */
export function CreatePlaylistPage() {
  const { t } = useTranslation()

  const [draft, setDraft] = useState<IPlaylistDraft>(EMPTY_DRAFT)
  /**
   * Issues are computed from the first keystroke but only *shown* once the
   * person has tried to submit. Marking a form invalid before they have had a
   * chance to fill it in reads as being told off for not having finished.
   */
  const [hasAttempted, setHasAttempted] = useState(false)

  const create = useCreatePlaylist()

  const isSubmitting = create.status === 'creating'
  const issues = useMemo(() => validatePlaylistDraft(draft), [draft])
  const failure = create.status === 'failed' ? create.failure : null

  /**
   * A rejection of the details themselves is shown *at the title*, because it is
   * the only failure the person caused and the only one editing can fix. Every
   * other failure is about the world, not the form, so it is shown above it.
   */
  const shownIssues = useMemo(
    () => ({
      ...(hasAttempted ? issues : {}),
      ...(failure === 'invalidPlaylistDetails' ? { title: 'rejectedByYouTube' as const } : {}),
    }),
    [hasAttempted, issues, failure],
  )

  const handleSubmit = useCallback(() => {
    setHasAttempted(true)

    void create.submit(draft)
  }, [create, draft])

  /**
   * Editing clears a previous failure. Leaving it up would leave the form
   * contradicting itself — a rejection pinned to a title that has since been
   * changed. The draft itself is never touched by a failure.
   */
  const handleChange = useCallback(
    (next: IPlaylistDraft) => {
      setDraft(next)

      if (create.status === 'failed') {
        create.reset()
      }
    },
    [create],
  )

  const startAnother = useCallback(() => {
    create.reset()
    setDraft(EMPTY_DRAFT)
    setHasAttempted(false)
  }, [create])

  if (create.status === 'succeeded' && create.created) {
    const created = create.created

    return (
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-brand/30 bg-brand-muted/40 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
            <CheckCircle2 className="h-6 w-6 text-brand" aria-hidden="true" />
          </div>

          <p className="font-semibold">{t('create.success.title')}</p>

          <p dir="auto" className="max-w-md truncate text-sm font-medium">
            {created.title}
          </p>

          {/* The visibility is shown back, so the outcome is visible rather
              than assumed — the point of having required the choice. */}
          <p className="text-sm text-muted-foreground">
            {t('create.success.privacy', { privacy: t(`create.privacy.${created.privacy}`) })}
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <a
              href={playlistUrl(created.id)}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ variant: 'brand' })}>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {t('common.openOnYouTube')}
            </a>

            <Button variant="outline" onClick={startAnother}>
              {t('create.success.another')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('create.title')}</h1>

        <p className="mt-1 text-sm text-muted-foreground sm:text-base">{t('create.subtitle')}</p>
      </div>

      {failure !== null && failure !== 'invalidPlaylistDetails' && (
        <ErrorState
          code={failure}
          messageKey={`create.errors.${failure}`}
          onRetry={
            NO_RETRY.includes(failure)
              ? undefined
              : () => {
                  void create.submit(draft)
                }
          }
          className="mb-4"
        />
      )}

      <PlaylistForm
        draft={draft}
        issues={shownIssues}
        canSubmit={isDraftSubmittable(draft)}
        isSubmitting={isSubmitting}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
