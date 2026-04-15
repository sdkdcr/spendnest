import { create } from 'zustand'
import {
  applyTheme,
  getInitialThemeMode,
  persistThemeMode,
} from '../../features/theme/theme.runtime'
import type { ThemeMode } from '../../features/theme/theme.types'

interface AppState {
  selectedFamilyId: number | null
  selectedMonthKey: string
  themeMode: ThemeMode
  setSelectedFamilyId: (familyId: number | null) => void
  setSelectedMonthKey: (monthKey: string) => void
  setThemeMode: (mode: ThemeMode) => void
}

const currentMonthKey = new Date().toISOString().slice(0, 7)
const initialThemeMode = getInitialThemeMode()

export const useAppStore = create<AppState>((set) => ({
  selectedFamilyId: null,
  selectedMonthKey: currentMonthKey,
  themeMode: initialThemeMode,
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
}))
