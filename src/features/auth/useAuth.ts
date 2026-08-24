import { useContext } from 'react'

import { AuthContext, type IAuthContextValue } from '@/features/auth/AuthContext'

export function useAuth(): IAuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>')
  }

  return context
}
