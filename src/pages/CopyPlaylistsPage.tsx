import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PlaylistPanel } from '@/components/copy/PlaylistPanel'
import { PlaylistPicker } from '@/components/playlists/PlaylistPicker'
import { VideoCard } from '@/components/videos/VideoCard'
import { usePlaylistItems } from '@/features/playlists/usePlaylistItems'
import { usePlaylistSelection } from '@/features/playlists/usePlaylistSelection'
import type { IPlaylist } from '@/models/playlist'

type ChoosingFor = 'source' | 'destination' | null

/**
 * Copy Between Playlists: two playlists side by side, videos copied from one
 * into the other.
 *
 * Two independent `usePlaylistSelection()` instances, with **this page** owning
 * the one rule between them — that they must differ. Feature 001 wrote that
 * division into the hook's own documentation: it knows nothing about roles or
 * whether a pair is valid, because those belong to whichever feature composes
 * two selections. Putting the rule in the hook would push a copy-specific
 * constraint into code Reorder also uses.
 */
export function CopyPlaylistsPage() {
  const { t } = useTranslation()

  const source = usePlaylistSelection()
  const destination = usePlaylistSelection()

  const [choosingFor, setChoosingFor] = useState<ChoosingFor>(null)

  const sourceItems = usePlaylistItems(source.selectedId)
  const destinationItems = usePlaylistItems(destination.selectedId)

  const chooseSource = useCallback(
    (playlist: IPlaylist) => {
      // The rule holds from both directions. Choosing a source that is already
      // the destination would leave the same playlist on both sides, so the
      // destination gives way — the person just told us what they want to copy
      // *from*, which is the more recent intent.
      if (destination.selectedId === playlist.id) destination.clear()

      source.select(playlist)
      setChoosingFor(null)
    },
    [source, destination],
  )

  const chooseDestination = useCallback(
    (playlist: IPlaylist) => {
      destination.select(playlist)
      setChoosingFor(null)
    },
    [destination],
  )

  if (choosingFor !== null) {
    const isSource = choosingFor === 'source'

    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {isSource ? t('copy.source') : t('copy.destination')}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {isSource ? t('copy.selectSource') : t('copy.selectDestination')}
          </p>
        </div>

        <PlaylistPicker
          selectedId={isSource ? source.selectedId : destination.selectedId}
          // The source cannot also be the destination, so it is not offered.
          excludeId={isSource ? destination.selectedId : source.selectedId}
          onSelect={isSource ? chooseSource : chooseDestination}
          label={isSource ? t('copy.source') : t('copy.destination')}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('copy.title')}</h1>

        <p className="mt-1 text-sm text-muted-foreground sm:text-base">{t('copy.subtitle')}</p>
      </div>

      {/* Side by side once there is room; stacked below that, source first, so
          the reading order matches the direction of the copy. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PlaylistPanel
          role="source"
          playlist={source.selected}
          onChoose={() => {
            setChoosingFor('source')
          }}
          state={sourceItems}>
          {sourceItems.items.length > 0 && (
            <ul className="flex flex-col gap-2">
              {/* Plain rows for now. T017 replaces these with draggable,
                  selectable ones once VideoCard grows its slots. */}
              {sourceItems.items.map((item, index) => (
                <li key={item.id}>
                  <VideoCard item={item} position={index + 1} />
                </li>
              ))}
            </ul>
          )}
        </PlaylistPanel>

        <PlaylistPanel
          role="destination"
          playlist={destination.selected}
          onChoose={() => {
            setChoosingFor('destination')
          }}
          state={destinationItems}>
          {destinationItems.items.length > 0 && (
            <ul className="flex flex-col gap-2">
              {/* T018 replaces these with drop targets carrying the pending
                  and duplicate marking. */}
              {destinationItems.items.map((item, index) => (
                <li key={item.id}>
                  <VideoCard item={item} position={index + 1} />
                </li>
              ))}
            </ul>
          )}
        </PlaylistPanel>
      </div>
    </div>
  )
}
