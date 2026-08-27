import { Check, Globe, Link2, Lock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PlaylistThumbnail } from '@/components/playlists/PlaylistThumbnail'
import type { IPlaylist, PlaylistPrivacy } from '@/models/playlist'
import { cn } from '@/utils/cn'

/** Icon *and* text label per privacy, so the distinction never rests on colour (FR-003). */
const PRIVACY_ICONS: Record<PlaylistPrivacy, LucideIcon> = {
  public: Globe,
  unlisted: Link2,
  private: Lock,
}

interface PlaylistCardProps {
  playlist: IPlaylist
  selected?: boolean
  onSelect: (playlist: IPlaylist) => void
}

/**
 * One playlist, as a single control.
 *
 * The whole card is one `<button>` rather than a div with a nested button: it
 * gives one tab stop, one focus ring, and Enter/Space activation for free, and
 * it is what makes the surface completable by keyboard alone (FR-017).
 *
 * No `aria-label` is set. An aria-label would *replace* the button's accessible
 * name, collapsing "Holiday mix, 12 videos, Unlisted" down to just the title —
 * and two playlists sharing a title would then be indistinguishable to a screen
 * reader. Letting the name come from the contents keeps the count and privacy in
 * it, which is exactly the duplicate-titles edge case.
 */
export function PlaylistCard({ playlist, selected = false, onSelect }: PlaylistCardProps) {
  const { t } = useTranslation()

  const PrivacyIcon = PRIVACY_ICONS[playlist.privacy]

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => {
        onSelect(playlist)
      }}
      className={cn(
        'group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-card text-start shadow-card transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        // Selection is a ring *and* a check mark — never colour on its own.
        selected && 'border-brand ring-2 ring-brand',
      )}>
      <div className="relative">
        <PlaylistThumbnail src={playlist.thumbnailUrl} seed={playlist.id} />

        {/* Inside the button on purpose: the count belongs to the accessible name. */}
        <span className="absolute end-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur">
          {t('playlist.videoCount', { count: playlist.itemCount })}
        </span>

        {selected && (
          <span className="absolute start-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-sm">
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            <span className="sr-only">{t('playlist.selected')}</span>
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 p-3">
        {/* Deliberately not a heading. The whole card is the button, so a
            heading here would put one in the outline per playlist — fifty cards
            would be fifty entries in a screen reader's heading list that are
            really control labels, and jumping to one would land the user inside
            a button. `line-clamp-2` sets `display:-webkit-box` regardless of
            the element, so this renders identically.

            `dir="auto"` so a title's own direction wins over the interface
            direction — an Arabic title stays right-to-left in the English UI. */}
        <span dir="auto" className="line-clamp-2 text-sm leading-snug font-medium">
          {playlist.title === '' ? t('playlist.untitled') : playlist.title}
        </span>

        <span className="mt-2 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs text-muted-foreground">
          <PrivacyIcon className="h-3 w-3" aria-hidden="true" />
          {t(`playlist.privacy.${playlist.privacy}`)}
        </span>
      </div>
    </button>
  )
}
