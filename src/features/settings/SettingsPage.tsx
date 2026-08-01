import { useMemo } from 'react'
import { resolveTheme } from '../theme/theme.runtime'
import type { ThemeMode } from '../theme/theme.types'
import { useAppStore } from '../../shared/state/useAppStore'
import { useFamilies } from '../families/useFamilies'
import { BackupPanel } from './BackupPanel'
import { CategoryPanel } from './CategoryPanel'
import { CloudSyncPanel } from './CloudSyncPanel'
import { DangerZonePanel } from './DangerZonePanel'
import './settings.css'

export function SettingsPage() {
  const { families } = useFamilies()
  const selectedFamilyId = useAppStore((state) => state.selectedFamilyId)
  const selectedFamilyName = useMemo(() => {
    if (selectedFamilyId === null) {
      return null
    }

    return families.find((family) => family.id === selectedFamilyId)?.name ?? null
  }, [families, selectedFamilyId])
  const selectedMonthKey = useAppStore((state) => state.selectedMonthKey)
  const setSelectedMonthKey = useAppStore((state) => state.setSelectedMonthKey)
  const themeMode = useAppStore((state) => state.themeMode)
  const setThemeMode = useAppStore((state) => state.setThemeMode)

  return (
    <section>
      <h2>Settings</h2>

      <div className="settings-field">
        <label htmlFor="theme-mode">Theme</label>
        <select
          id="theme-mode"
          value={themeMode}
          onChange={(event) => {
            setThemeMode(event.currentTarget.value as ThemeMode)
          }}
        >
          <option value="device">Device Theme</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
        <p className="field-help">Active: {resolveTheme(themeMode)}</p>
      </div>

      <div className="settings-field">
        <label htmlFor="month-key">Default month</label>
        <input
          id="month-key"
          type="month"
          value={selectedMonthKey}
          onChange={(event) => {
            setSelectedMonthKey(event.currentTarget.value)
          }}
        />
      </div>

      <CategoryPanel familyId={selectedFamilyId} familyName={selectedFamilyName} />

      <CloudSyncPanel />

      <BackupPanel />

      <DangerZonePanel />
    </section>
  )
}
