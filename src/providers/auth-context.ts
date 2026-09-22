import { createContext } from 'react'

import type { IAuthContextValue } from '@/models/auth.interface'

export const AuthContext = createContext<IAuthContextValue | null>(null)
