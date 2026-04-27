import type { ThemeMode } from '../../features/theme/theme.types'
import type { AuthUser } from '../firebase/auth'

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

export interface AppState {
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
  repairCloud: () => Promise<void>
  clearSpends: () => Promise<void>
  deregister: () => Promise<void>
}
