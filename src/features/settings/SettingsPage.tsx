import { resolveTheme } from '../theme/theme.runtime'
import type { ThemeMode } from '../theme/theme.types'
import { useAppStore } from '../../shared/state/useAppStore'
import { BackupPanel } from './BackupPanel'
import './settings.css'

export function SettingsPage() {
  const selectedMonthKey = useAppStore((state) => state.selectedMonthKey)
  const setSelectedMonthKey = useAppStore((state) => state.setSelectedMonthKey)
  const themeMode = useAppStore((state) => state.themeMode)
  const setThemeMode = useAppStore((state) => state.setThemeMode)
  const firebaseEnabled = useAppStore((state) => state.firebaseEnabled)
  const authReady = useAppStore((state) => state.authReady)
  const authUser = useAppStore((state) => state.authUser)
  const authError = useAppStore((state) => state.authError)
  const syncStatus = useAppStore((state) => state.syncStatus)
  const syncMessage = useAppStore((state) => state.syncMessage)
  const signInWithGoogle = useAppStore((state) => state.signInWithGoogle)
  const signOut = useAppStore((state) => state.signOut)
  const syncNow = useAppStore((state) => state.syncNow)
  const autoSyncEnabled = useAppStore((state) => state.autoSyncEnabled)
  const setAutoSyncEnabled = useAppStore((state) => state.setAutoSyncEnabled)
  const isSyncing = syncStatus === 'syncing'

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

      <div className="settings-auth-panel">
        <h3>Cloud Sync</h3>
        {!firebaseEnabled && (
          <p className="field-help">
            Firebase is not configured. Add `VITE_FIREBASE_*` env vars for local and
            Cloudflare Pages.
          </p>
        )}
        {firebaseEnabled && (
          <>
            <p className="field-help">
              Auth status:{' '}
              {authReady
                ? authUser
                  ? `Signed in as ${authUser.email ?? authUser.displayName ?? authUser.uid}`
                  : 'Signed out'
                : 'Checking session...'}
            </p>
            {authUser && (
              <div className="settings-checkbox-row">
                <label className="settings-checkbox-label" htmlFor="auto-sync-enabled">
                  <input
                    id="auto-sync-enabled"
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={(event) => {
                      setAutoSyncEnabled(event.currentTarget.checked)
                    }}
                  />
                  Enable auto-sync
                </label>
                <p className="field-help">
                  Default is manual sync. Keep this off to sync only when you click
                  `Sync now`.
                </p>
              </div>
            )}
            {syncMessage && <p className="field-help">Sync: {syncMessage}</p>}
            {authError && <p className="settings-error">{authError}</p>}
            <div className="settings-auth-actions">
              {!authUser ? (
                <button
                  type="button"
                  disabled={!firebaseEnabled || !authReady}
                  onClick={() => {
                    void signInWithGoogle()
                  }}
                >
                  Sign in with Google
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={!authReady || isSyncing}
                    onClick={() => {
                      void syncNow()
                    }}
                  >
                    {isSyncing ? 'Syncing...' : 'Sync now'}
                  </button>
                  <button
                    type="button"
                    disabled={!authReady}
                    onClick={() => {
                      void signOut()
                    }}
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <BackupPanel />
    </section>
  )
}
