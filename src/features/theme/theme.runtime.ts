import type { ResolvedTheme, ThemeMode } from './theme.types'

const STORAGE_KEY = 'spendnest.themeMode'

function supportsDeviceTheme(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
  )
}

function isThemeMode(value: string): value is ThemeMode {
  return value === 'device' || value === 'dark' || value === 'light'
}

export function getDefaultThemeMode(): ThemeMode {
  return supportsDeviceTheme() ? 'device' : 'dark'
}

export function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored && isThemeMode(stored)) {
    return stored
  }

  return getDefaultThemeMode()
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'dark' || mode === 'light') {
    return mode
  }

  if (!supportsDeviceTheme()) {
    return 'dark'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') {
    return
  }

  const resolvedTheme = resolveTheme(mode)
  document.documentElement.dataset.theme = resolvedTheme
  document.documentElement.style.colorScheme = resolvedTheme
}

export function persistThemeMode(mode: ThemeMode): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, mode)
}

export function watchDeviceTheme(onChange: () => void): (() => void) | null {
  if (!supportsDeviceTheme()) {
    return null
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const listener = () => {
    onChange()
  }

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', listener)
    return () => {
      mediaQuery.removeEventListener('change', listener)
    }
  }

  mediaQuery.addListener(listener)
  return () => {
    mediaQuery.removeListener(listener)
  }
}
