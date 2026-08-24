import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ROUTES } from '@/routes'

export const router = createBrowserRouter(
  [
    { path: ROUTES.landing, element: <LandingPage /> },
    {
      element: <AppLayout />,
      children: [{ path: ROUTES.dashboard, element: <DashboardPage /> }],
    },
    { path: '*', element: <NotFoundPage /> },
  ],
  // Honours the Vite `base` setting, so a GitHub Pages project page works unchanged.
  { basename: import.meta.env.BASE_URL },
)
