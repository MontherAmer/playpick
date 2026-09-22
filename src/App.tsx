import type { JSX } from 'react'

import { LandingPage } from '@/components/landing/landing-page'
import { AuthProvider } from '@/providers/auth-provider'

function App(): JSX.Element {
  return (
    <AuthProvider>
      <LandingPage />
    </AuthProvider>
  )
}

export default App
