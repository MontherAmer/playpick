import { LogOut } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@/features/auth/useAuth'
import { useDisclosureMenu } from '@/hooks/useDisclosureMenu'

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function UserMenu() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const { isOpen, toggle, close, triggerRef, panelRef } = useDisclosureMenu()
  const panelId = useId()
  const [pictureFailed, setPictureFailed] = useState(false)

  if (!user) return null

  const showPicture = user.pictureUrl !== undefined && !pictureFailed

  return (
    <div className="relative">
      <button
        type="button"
        ref={triggerRef}
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        // The name is hidden at the narrowest widths, which would otherwise
        // leave the control an unnamed avatar.
        aria-label={t('nav.account')}
        className="flex items-center gap-2 rounded-full border p-1 pe-3 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        {showPicture ? (
          <img
            src={user.pictureUrl}
            alt=""
            onError={() => {
              setPictureFailed(true)
            }}
            className="h-7 w-7 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
            {initialsOf(user.name)}
          </span>
        )}

        <span className="hidden max-w-[160px] truncate text-sm font-medium sm:block">{user.name}</span>
      </button>

      {isOpen && (
        <div
          id={panelId}
          ref={panelRef}
          className="absolute end-0 top-full z-50 mt-1 w-64 rounded-lg border bg-popover p-1 text-popover-foreground shadow-elevated">
          <div className="px-2 py-1.5">
            <span className="block text-xs font-medium text-muted-foreground">{t('auth.connectedAs')}</span>
            <span className="mt-0.5 block truncate text-sm font-semibold">{user.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          </div>

          <div className="my-1 h-px bg-border" role="separator" />

          <button
            type="button"
            onClick={() => {
              close()
              signOut()
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <LogOut className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            {t('auth.signOut')}
          </button>
        </div>
      )}
    </div>
  )
}
