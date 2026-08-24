import { Navigate, Outlet } from 'react-router-dom'

import { FullPageLoader } from '@/components/common/FullPageLoader'
import { AppHeader } from '@/components/layout/AppHeader'
import { useAuth } from '@/features/auth/useAuth'
import { ROUTES } from '@/routes'

/** Shell and auth guard for the signed-in area. */
export function AppLayout() {
  const { status, isAuthenticated } = useAuth()

  // Wait for the silent restore before deciding, otherwise a reload would
  // bounce an authenticated user back to the landing page.
  if (status === 'restoring') {
    return <FullPageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.landing} replace />
  }

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
