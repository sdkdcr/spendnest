import { useAppStore } from '../../shared/state/useAppStore'

export function DangerZonePanel() {
  const firebaseEnabled = useAppStore((state) => state.firebaseEnabled)
  const authUser = useAppStore((state) => state.authUser)
  const syncStatus = useAppStore((state) => state.syncStatus)
  const clearSpends = useAppStore((state) => state.clearSpends)
  const deregister = useAppStore((state) => state.deregister)
  const discardLocalAndPullFromCloud = useAppStore((state) => state.discardLocalAndPullFromCloud)
  const isSyncing = syncStatus === 'syncing'

  if (!firebaseEnabled || !authUser) {
    return null
  }

  return (
    <div className="settings-danger-panel">
      <h3>Danger zone</h3>
      <p className="field-help">These actions are irreversible. Proceed with caution.</p>
      <div className="settings-auth-actions">
        <button
          className="settings-button-danger"
          type="button"
          disabled={isSyncing}
          onClick={() => {
            if (
              window.confirm(
                'This will erase all local data on this device and replace it with whatever is currently in the cloud. Any local changes not yet synced will be lost. Continue?',
              )
            ) {
              void discardLocalAndPullFromCloud()
            }
          }}
        >
          Clear local data &amp; pull from cloud
        </button>
        <button
          className="settings-button-danger"
          type="button"
          disabled={isSyncing}
          onClick={() => {
            if (
              window.confirm(
                'This will permanently delete all spend templates and monthly transactions from local and cloud. Families and persons will be kept. Continue?',
              )
            ) {
              void clearSpends()
            }
          }}
        >
          Clear all spends &amp; transactions
        </button>
        <button
          className="settings-button-danger"
          type="button"
          disabled={isSyncing}
          onClick={() => {
            if (
              window.confirm(
                'This will permanently delete ALL data (families, persons, spends) from local and cloud, and delete your account. This cannot be undone. Continue?',
              )
            ) {
              void deregister()
            }
          }}
        >
          De-register &amp; delete account
        </button>
      </div>
    </div>
  )
}
