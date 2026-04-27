import { appDb } from '../db/appDb'
import { deleteCurrentUser } from '../firebase/auth'
import {
  clearSpendsLocalAndCloud,
  deregisterLocalAndCloud,
  repairCloudData,
  syncUserData,
} from '../sync/sync.service'
import type { AppState } from './store.types'

type SetFn = (patch: Partial<AppState>) => void
type GetFn = () => AppState

export async function ensureSelectedFamilyAfterSync(set: SetFn, get: GetFn): Promise<void> {
  const state = get()

  if (state.selectedFamilyId !== null) {
    const selectedFamily = await appDb.families.get(state.selectedFamilyId)
    if (selectedFamily) {
      return
    }
  }

  const firstFamily = await appDb.families.orderBy('updatedAt').reverse().first()
  set({ selectedFamilyId: firstFamily?.id ?? null })
}

export async function handleSyncNow(set: SetFn, get: GetFn): Promise<void> {
  const state = get()
  if (!state.authUser) {
    set({ syncStatus: 'error', syncMessage: 'Sign in first to sync cloud data.' })
    return
  }

  set({ syncStatus: 'syncing', syncMessage: 'Syncing cloud data...', authError: null })

  try {
    const summary = await syncUserData(state.authUser.uid, state.authUser.email ?? '')
    await ensureSelectedFamilyAfterSync(set, get)
    set({
      syncStatus: 'success',
      syncMessage: `Sync complete. Pushed ${summary.pushed}, pulled ${summary.pulled} records.`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed. Please retry.'
    set({ syncStatus: 'error', syncMessage: message })
  }
}

export async function handleRepairCloud(set: SetFn, get: GetFn): Promise<void> {
  const state = get()
  if (!state.authUser) {
    set({ syncStatus: 'error', syncMessage: 'Sign in first to repair cloud data.' })
    return
  }

  set({ syncStatus: 'syncing', syncMessage: 'Repairing cloud data...', authError: null })

  try {
    const summary = await repairCloudData(state.authUser.uid, state.authUser.email ?? '')
    set({
      syncStatus: 'success',
      syncMessage: `Repair complete. Removed ${summary.deleted} duplicate(s), pushed ${summary.pushed} records.`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Repair failed. Please retry.'
    set({ syncStatus: 'error', syncMessage: message })
  }
}

export async function handleClearSpends(set: SetFn, get: GetFn): Promise<void> {
  const state = get()
  if (!state.authUser) {
    set({ syncStatus: 'error', syncMessage: 'Sign in first to clear cloud data.' })
    return
  }

  set({ syncStatus: 'syncing', syncMessage: 'Clearing spends and transactions...', authError: null })

  try {
    await clearSpendsLocalAndCloud()
    set({
      syncStatus: 'success',
      syncMessage: 'All spends and transactions cleared from local and cloud.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Clear failed. Please retry.'
    set({ syncStatus: 'error', syncMessage: message })
  }
}

export async function handleDeregister(set: SetFn, get: GetFn): Promise<void> {
  const state = get()
  if (!state.authUser) {
    set({ syncStatus: 'error', syncMessage: 'Sign in first to deregister.' })
    return
  }

  set({ syncStatus: 'syncing', syncMessage: 'Deleting all data and account...', authError: null })

  try {
    await deregisterLocalAndCloud()
    await deleteCurrentUser()
    set({ syncStatus: 'idle', syncMessage: null, authUser: null, selectedFamilyId: null })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Deregister failed. Please retry.'
    set({ syncStatus: 'error', syncMessage: message })
  }
}
