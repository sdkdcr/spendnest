import { useAppStore } from '../state/useAppStore'

export function SyncBanner() {
  const isSyncBannerVisible = useAppStore((state) => state.isSyncBannerVisible)
  const syncStatus = useAppStore((state) => state.syncStatus)
  const discardLocalAndPullFromCloud = useAppStore((state) => state.discardLocalAndPullFromCloud)
  const overrideCloudWithLocal = useAppStore((state) => state.overrideCloudWithLocal)

  if (!isSyncBannerVisible) {
    return null
  }

  const isBusy = syncStatus === 'syncing'

  return (
    <div className="app-update-banner sync-banner">
      <span>Local and cloud data differ for this family.</span>
      <div className="sync-banner-actions">
        <button
          type="button"
          className="app-update-btn"
          disabled={isBusy}
          onClick={() => {
            void discardLocalAndPullFromCloud()
          }}
        >
          Discard local & pull from cloud
        </button>
        <button
          type="button"
          className="app-update-btn"
          disabled={isBusy}
          onClick={() => {
            void overrideCloudWithLocal()
          }}
        >
          Override cloud with local
        </button>
      </div>
    </div>
  )
}
