import { evaluateLaunchSyncState } from '../sync/sync.launch-check'
import { pullCloudDataToLocal } from '../sync/sync.pull'
import { pushLocalDataToCloud } from '../sync/sync.push'
import { syncCloudTokensFromLocal, syncLocalTokensFromCloud } from '../sync/sync.tokens'
import { ensureSelectedFamilyAfterSync } from './syncActions'
import type { AppState } from './store.types'

type SetFn = (patch: Partial<AppState>) => void
type GetFn = () => AppState

export async function handleRunLaunchSyncCheck(set: SetFn, get: GetFn): Promise<void> {
  const state = get()
  if (!state.authUser) {
    return
  }

  try {
    const outcome = await evaluateLaunchSyncState()

    if (outcome === 'needs-banner') {
      set({ isSyncBannerVisible: true })
      return
    }

    if (outcome === 'auto-pulled') {
      await pullCloudDataToLocal(state.authUser.email ?? '')
      await syncLocalTokensFromCloud()
      await ensureSelectedFamilyAfterSync(set, get)
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Launch-time sync check failed.'
    set({ syncStatus: 'error', syncMessage: message })
  }
}

export async function handleDiscardLocalAndPullFromCloud(
  set: SetFn,
  get: GetFn,
): Promise<void> {
  const state = get()
  if (!state.authUser) {
    return
  }

  set({ syncStatus: 'syncing', syncMessage: 'Pulling cloud data...', authError: null })

  try {
    await pullCloudDataToLocal(state.authUser.email ?? '')
    await syncLocalTokensFromCloud()
    await ensureSelectedFamilyAfterSync(set, get)
    set({
      syncStatus: 'success',
      syncMessage: 'Local data replaced with cloud data.',
      isSyncBannerVisible: false,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pull failed. Please retry.'
    set({ syncStatus: 'error', syncMessage: message })
  }
}

export async function handleOverrideCloudWithLocal(set: SetFn, get: GetFn): Promise<void> {
  const state = get()
  if (!state.authUser) {
    return
  }

  set({ syncStatus: 'syncing', syncMessage: 'Pushing local data to cloud...', authError: null })

  try {
    await pushLocalDataToCloud(state.authUser.uid, state.authUser.email ?? '')
    await syncCloudTokensFromLocal(state.authUser.uid, state.authUser.email ?? '')
    set({
      syncStatus: 'success',
      syncMessage: 'Cloud data replaced with local data.',
      isSyncBannerVisible: false,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Push failed. Please retry.'
    set({ syncStatus: 'error', syncMessage: message })
  }
}
