import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { applyTheme, watchDeviceTheme } from '../features/theme/theme.runtime'
import { appDb } from '../shared/db/appDb'
import { useAppStore } from '../shared/state/useAppStore'
import './app-shell.css'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/spends', label: 'Spends' },
  { to: '/families', label: 'Families' },
  { to: '/settings', label: 'Settings' },
]

function formatMonthLabel(monthKey: string): string {
  const [yearToken, monthToken] = monthKey.split('-')
  const year = Number(yearToken)
  const month = Number(monthToken)

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return monthKey
  }

  const monthDate = new Date(year, month - 1, 1)
  const monthLabel = monthDate.toLocaleString('en-US', { month: 'short' })
  const shortYear = String(year).slice(-2)

  return `${monthLabel}'${shortYear}`
}

export function AppShell() {
  const selectedFamilyId = useAppStore((state) => state.selectedFamilyId)
  const selectedMonthKey = useAppStore((state) => state.selectedMonthKey)
  const setSelectedMonthKey = useAppStore((state) => state.setSelectedMonthKey)
  const themeMode = useAppStore((state) => state.themeMode)
  const firebaseEnabled = useAppStore((state) => state.firebaseEnabled)
  const authReady = useAppStore((state) => state.authReady)
  const authUser = useAppStore((state) => state.authUser)
  const [selectedFamilyName, setSelectedFamilyName] = useState<string | null>(null)
  const monthPickerRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    applyTheme(themeMode)

    if (themeMode !== 'device') {
      return
    }

    const stopWatching = watchDeviceTheme(() => {
      applyTheme('device')
    })

    return () => {
      stopWatching?.()
    }
  }, [themeMode])

  useEffect(() => {
    let isCancelled = false

    async function loadSelectedFamilyName() {
      if (selectedFamilyId === null) {
        setSelectedFamilyName(null)
        return
      }

      const family = await appDb.families.get(selectedFamilyId)
      if (!isCancelled) {
        setSelectedFamilyName(family?.name ?? null)
      }
    }

    void loadSelectedFamilyName()

    return () => {
      isCancelled = true
    }
  }, [selectedFamilyId])

  const currentMonthKey = new Date().toISOString().slice(0, 7)
  const isCurrentMonthSelected = selectedMonthKey === currentMonthKey
  const authSummary = !firebaseEnabled
    ? 'Local mode'
    : !authReady
      ? 'Checking session...'
      : authUser
        ? authUser.displayName ?? authUser.email ?? authUser.uid
        : 'Not signed in'
  const authDetail = authUser?.displayName && authUser.email ? authUser.email : null

  function openMonthPicker() {
    const input = monthPickerRef.current
    if (!input) {
      return
    }

    const pickerInput = input as HTMLInputElement & {
      showPicker?: () => void
    }

    if (typeof pickerInput.showPicker === 'function') {
      pickerInput.showPicker()
      return
    }

    input.focus()
    input.click()
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">SpendNest</p>
          <h1>Family Budget Tracker</h1>
        </div>
        <div className="app-header-meta">
          <div className="app-month-toolbar">
            <span className="app-month-pill">
              Selected: {formatMonthLabel(selectedMonthKey)}
            </span>
            <button
              className="app-month-btn"
              type="button"
              disabled={isCurrentMonthSelected}
              onClick={() => {
                setSelectedMonthKey(currentMonthKey)
              }}
            >
              Current Month
            </button>
            <button
              className="app-month-btn"
              type="button"
              onClick={openMonthPicker}
            >
              Choose month
            </button>
            <input
              ref={monthPickerRef}
              className="app-month-picker-input"
              type="month"
              value={selectedMonthKey}
              onChange={(event) => {
                setSelectedMonthKey(event.currentTarget.value)
              }}
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
        </div>
      </header>

      <div className="app-layout">
        <aside className="app-nav">
          <div className="app-nav-overview">
            <p className="app-nav-kicker">Account</p>
            <p className="app-nav-user">{authSummary}</p>
            {authDetail && <p className="app-nav-detail">{authDetail}</p>}
            <p className="app-nav-family">Family: {selectedFamilyName ?? 'Not selected'}</p>
          </div>

          <nav className="app-nav-links" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  isActive ? 'nav-link nav-link-active' : 'nav-link'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
