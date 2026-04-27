import { signInWithGooglePopup, signOutCurrentUser } from '../firebase/auth'
import { isFirebaseConfigured } from '../firebase/firebaseApp'
import type { AppState } from './store.types'

type SetFn = (patch: Partial<AppState>) => void

export async function handleSignInWithGoogle(set: SetFn): Promise<void> {
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
}

export async function handleSignOut(set: SetFn): Promise<void> {
  try {
    await signOutCurrentUser()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Sign-out failed. Please retry.'
    set({ authError: message })
  }
}
