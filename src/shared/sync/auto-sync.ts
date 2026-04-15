import { useAppStore } from '../state/useAppStore'
import { pushLocalDataToCloud } from './sync.service'

const AUTO_SYNC_DEBOUNCE_MS = 1500

let pendingTimer: ReturnType<typeof setTimeout> | null = null
let syncInFlight = false
let needsResync = false

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Cloud sync failed.'
}

async function runAutoSync(): Promise<void> {
  const state = useAppStore.getState()
  if (!state.firebaseEnabled || !state.authUser) {
    return
  }

  if (syncInFlight) {
    needsResync = true
    return
  }

  syncInFlight = true
  state.setSyncState('syncing', 'Syncing cloud data...')

  try {
    const summary = await pushLocalDataToCloud(
      state.authUser.uid,
      state.authUser.email ?? '',
    )
    useAppStore
      .getState()
      .setSyncState('success', `Sync complete. Pushed ${summary.pushed} records.`)
  } catch (error) {
    useAppStore
      .getState()
      .setSyncState('error', `Auto-sync failed: ${getErrorMessage(error)}`)
  } finally {
    syncInFlight = false
    if (needsResync) {
      needsResync = false
      requestAutoSync()
    }
  }
}

export function requestAutoSync(): void {
  const state = useAppStore.getState()
  if (!state.firebaseEnabled || !state.authUser || !state.autoSyncEnabled) {
    return
  }

  if (pendingTimer !== null) {
    clearTimeout(pendingTimer)
  }

  pendingTimer = setTimeout(() => {
    pendingTimer = null
    void runAutoSync()
  }, AUTO_SYNC_DEBOUNCE_MS)
}
