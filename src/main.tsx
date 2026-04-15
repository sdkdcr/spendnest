import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { bootstrapApp } from './app/bootstrap'
import { router } from './app/routes'
import { applyTheme, getInitialThemeMode } from './features/theme/theme.runtime'
import './main.css'

applyTheme(getInitialThemeMode())
void bootstrapApp()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
