import type { ChangeEvent, JSX } from 'react'

import { ListVideo } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { IPlaylist } from '@/models/copy.interface'

interface IPlaylistSelectProps {
  label: string
  value?: string
  playlists: readonly IPlaylist[]
  excludedId?: string
  disabled?: boolean
  onChange: (playlistId: string) => void
}

export function PlaylistSelect({
  label,
  value,
  playlists,
  excludedId,
  disabled,
  onChange,
}: IPlaylistSelectProps): JSX.Element {
  const { t } = useTranslation()

  const handleChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    onChange(event.target.value)
  }

  return (
    <label className="block border-b border-border p-4">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="relative flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
          <ListVideo className="size-5" />
        </span>
        <select
          value={value ?? ''}
          disabled={disabled}
          onChange={handleChange}
          className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{t('copy.choosePlaylist')}</option>
          {playlists
            .filter((playlist) => playlist.id !== excludedId)
            .map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.title || t('copy.untitled')} · {playlist.itemCount}
              </option>
            ))}
        </select>
      </span>
    </label>
  )
}
