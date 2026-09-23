import type { ChangeEvent, JSX } from 'react'

import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import type { IPlaylistDraft } from '@/models/build.interface'
import type { PlaylistPrivacy } from '@/models/copy.interface'

interface IPlaylistDetailsFormProps {
  draft: IPlaylistDraft
  disabled?: boolean
  onChange: (field: keyof IPlaylistDraft, value: string | PlaylistPrivacy) => void
}

export function PlaylistDetailsForm({
  draft,
  disabled,
  onChange,
}: IPlaylistDetailsFormProps): JSX.Element {
  const { t } = useTranslation()

  const handlePrivacyChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const value = event.target.value

    if (value === 'private' || value === 'unlisted' || value === 'public') {
      onChange('privacy', value)
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold">
        {t('build.form.name')}
        <Input
          value={draft.title}
          disabled={disabled}
          maxLength={150}
          onChange={(event) => onChange('title', event.target.value)}
          placeholder={t('build.form.namePlaceholder')}
          className="mt-2"
        />
      </label>
      <label className="block text-sm font-semibold">
        {t('build.form.description')}
        <textarea
          value={draft.description}
          disabled={disabled}
          maxLength={5000}
          onChange={(event) => onChange('description', event.target.value)}
          placeholder={t('build.form.descriptionPlaceholder')}
          className="mt-2 min-h-24 w-full resize-y rounded-md border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </label>
      <label className="block text-sm font-semibold">
        {t('build.form.privacy')}
        <select
          value={draft.privacy}
          disabled={disabled}
          onChange={handlePrivacyChange}
          className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="private">{t('build.form.private')}</option>
          <option value="unlisted">{t('build.form.unlisted')}</option>
          <option value="public">{t('build.form.public')}</option>
        </select>
      </label>
    </div>
  )
}
