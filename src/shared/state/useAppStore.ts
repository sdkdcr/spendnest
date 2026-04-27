import { create } from 'zustand'
import {
  applyTheme,
  getInitialThemeMode,
  persistThemeMode,
} from '../../features/theme/theme.runtime'
import { isFirebaseConfigured } from '../firebase/firebaseApp'
import { handleSignInWithGoogle, handleSignOut } from './authActions'
import {
  handleClearSpends,
  handleDeregister,
  handleRepairCloud,
  handleSyncNow,
} from './syncActions'
import type { AppState } from './store.types'

export type { AppState, SyncStatus } from './store.types'

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

const currentMonthKey = new Date().toISOString().slice(0, 7)
const initialThemeMode = getInitialThemeMode()

export const useAppStore = create<AppState>((set, get) => ({
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
  setSelectedFamilyId: (familyId) => set({ selectedFamilyId: familyId }),
  setSelectedMonthKey: (monthKey) => set({ selectedMonthKey: monthKey }),
  setThemeMode: (mode) => {
    persistThemeMode(mode)
    applyTheme(mode)
    set({ themeMode: mode })
  },
  setAuthReady: (authReady) => set({ authReady }),
  setAuthSession: (user) => set({ authUser: user }),
  setAuthError: (errorMessage) => set({ authError: errorMessage }),
  setSyncState: (status, message) => set({ syncStatus: status, syncMessage: message }),
  setAutoSyncEnabled: (enabled) => {
    persistAutoSyncEnabled(enabled)
    set({ autoSyncEnabled: enabled })
  },
  signInWithGoogle: () => handleSignInWithGoogle(set),
  signOut: () => handleSignOut(set),
  syncNow: () => handleSyncNow(set, get),
  repairCloud: () => handleRepairCloud(set, get),
  clearSpends: () => handleClearSpends(set, get),
  deregister: () => handleDeregister(set, get),
}))
