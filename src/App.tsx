import type { JSX } from 'react'

import { RouterProvider } from 'react-router-dom'

import { AuthProvider } from '@/providers/auth-provider'
import { router } from '@/router'

function App(): JSX.Element {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
