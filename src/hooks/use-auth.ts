import { useContext } from 'react'

import type { IAuthContextValue } from '@/models/auth.interface'
import { AuthContext } from '@/providers/auth-context'

export function useAuth(): IAuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }

  return context
}
