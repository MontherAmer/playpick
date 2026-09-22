import type { JSX } from 'react'

import type { IUser } from '@/models/user.interface'

interface IUserAvatarProps {
  user: IUser
}

export function UserAvatar({ user }: IUserAvatarProps): JSX.Element {
  const initials = getUserInitials(user.name || user.email)

  if (user.pictureUrl) {
    return (
      <img
        src={user.pictureUrl}
        alt={user.name || user.email}
        width={36}
        height={36}
        className="ms-2 size-9 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    )
  }

  return (
    <div
      className="ms-2 grid size-9 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground"
      title={user.name || user.email}
      aria-label={user.name || user.email}
    >
      {initials}
    </div>
  )
}

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}
