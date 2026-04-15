import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './AppShell'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { FamiliesPage } from '../features/families/FamiliesPage'
import { NotFoundPage } from '../features/not-found/NotFoundPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { SpendsPage } from '../features/spends/SpendsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'spends', element: <SpendsPage /> },
      { path: 'families', element: <FamiliesPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
