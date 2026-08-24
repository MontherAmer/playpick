import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'

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

  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-2 rounded-full border p-1 pe-3">
        {user.pictureUrl ? (
          <img
            src={user.pictureUrl}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
            {initialsOf(user.name)}
          </span>
        )}

        <span className="hidden max-w-[160px] truncate text-sm font-medium sm:block">{user.name}</span>
      </span>

      <Button variant="ghost" size="icon" onClick={signOut} title={t('auth.signOut')}>
        <LogOut className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        <span className="sr-only">{t('auth.signOut')}</span>
      </Button>
    </div>
  )
}
