import { create } from 'zustand'
import {
  applyTheme,
  getInitialThemeMode,
  persistThemeMode,
} from '../../features/theme/theme.runtime'
import type { ThemeMode } from '../../features/theme/theme.types'
import type { AuthUser } from '../firebase/auth'
import { signInWithGooglePopup, signOutCurrentUser } from '../firebase/auth'
import { isFirebaseConfigured } from '../firebase/firebaseApp'
import { appDb } from '../db/appDb'
import { syncUserData } from '../sync/sync.service'

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'
const AUTO_SYNC_PREF_KEY = 'spendnest:auto-sync-enabled'

function getInitialAutoSyncEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(AUTO_SYNC_PREF_KEY) === 'true'
}

function persistAutoSyncEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTO_SYNC_PREF_KEY, String(enabled))
}

async function ensureSelectedFamilyAfterSync(): Promise<void> {
  const state = useAppStore.getState()

  if (state.selectedFamilyId !== null) {
    const selectedFamily = await appDb.families.get(state.selectedFamilyId)
    if (selectedFamily) {
      return
    }
  }

  const firstFamily = await appDb.families.orderBy('updatedAt').reverse().first()
  state.setSelectedFamilyId(firstFamily?.id ?? null)
}

interface AppState {
  selectedFamilyId: number | null
  selectedMonthKey: string
  themeMode: ThemeMode
  firebaseEnabled: boolean
  authReady: boolean
  authUser: AuthUser | null
  authError: string | null
  syncStatus: SyncStatus
  syncMessage: string | null
  autoSyncEnabled: boolean
  setSelectedFamilyId: (familyId: number | null) => void
  setSelectedMonthKey: (monthKey: string) => void
  setThemeMode: (mode: ThemeMode) => void
  setAuthReady: (authReady: boolean) => void
  setAuthSession: (user: AuthUser | null) => void
  setAuthError: (errorMessage: string | null) => void
  setSyncState: (status: SyncStatus, message: string | null) => void
  setAutoSyncEnabled: (enabled: boolean) => void
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  syncNow: () => Promise<void>
}

const currentMonthKey = new Date().toISOString().slice(0, 7)
const initialThemeMode = getInitialThemeMode()

export const useAppStore = create<AppState>((set) => ({
  selectedFamilyId: null,
  selectedMonthKey: currentMonthKey,
  themeMode: initialThemeMode,
  firebaseEnabled: isFirebaseConfigured,
  authReady: !isFirebaseConfigured,
  authUser: null,
  authError: null,
  syncStatus: 'idle',
  syncMessage: null,
  autoSyncEnabled: getInitialAutoSyncEnabled(),
  setSelectedFamilyId: (familyId) => {
    set({ selectedFamilyId: familyId })
  },
  setSelectedMonthKey: (monthKey) => {
    set({ selectedMonthKey: monthKey })
  },
  setThemeMode: (mode) => {
    persistThemeMode(mode)
    applyTheme(mode)
    set({ themeMode: mode })
  },
  setAuthReady: (authReady) => {
    set({ authReady })
  },
  setAuthSession: (user) => {
    set({ authUser: user })
  },
  setAuthError: (errorMessage) => {
    set({ authError: errorMessage })
  },
  setSyncState: (status, message) => {
    set({
      syncStatus: status,
      syncMessage: message,
    })
  },
  setAutoSyncEnabled: (enabled) => {
    persistAutoSyncEnabled(enabled)
    set({ autoSyncEnabled: enabled })
  },
  signInWithGoogle: async () => {
    if (!isFirebaseConfigured) {
      set({ authError: 'Firebase env is missing. Check VITE_FIREBASE_* values.' })
      return
    }

    set({ authError: null })

    try {
      await signInWithGooglePopup()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Google sign-in failed. Please retry.'
      set({ authError: message })
    }
  },
  signOut: async () => {
    try {
      await signOutCurrentUser()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Sign-out failed. Please retry.'
      set({ authError: message })
    }
  },
  syncNow: async () => {
    const state = useAppStore.getState()
    if (!state.authUser) {
      set({
        syncStatus: 'error',
        syncMessage: 'Sign in first to sync cloud data.',
      })
      return
    }

    set({
      syncStatus: 'syncing',
      syncMessage: 'Syncing cloud data...',
      authError: null,
    })

    try {
      const summary = await syncUserData(state.authUser.uid)
      await ensureSelectedFamilyAfterSync()
      set({
        syncStatus: 'success',
        syncMessage: `Sync complete. Pushed ${summary.pushed}, pulled ${summary.pulled} records.`,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Sync failed. Please retry.'
      set({
        syncStatus: 'error',
        syncMessage: message,
      })
    }
  },
}))
