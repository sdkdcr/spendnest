import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type AuthError,
  type User,
} from 'firebase/auth'
import { getFirebaseApp, isFirebaseConfigured } from './firebaseApp'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
}

function mapAuthUser(user: User | null): AuthUser | null {
  if (!user) {
    return null
  }

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  }
}

export function subscribeAuthState(
  onChange: (user: AuthUser | null) => void,
): () => void {
  if (!isFirebaseConfigured) {
    onChange(null)
    return () => undefined
  }

  const auth = getAuth(getFirebaseApp())

  return onAuthStateChanged(auth, (user) => {
    onChange(mapAuthUser(user))
  })
}

export async function signInWithGooglePopup(): Promise<AuthUser> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured.')
  }

  const auth = getAuth(getFirebaseApp())
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  const authUser = mapAuthUser(result.user)

  if (!authUser) {
    throw new Error('Google sign-in did not return a valid user.')
  }

  return authUser
}

export async function signOutCurrentUser(): Promise<void> {
  if (!isFirebaseConfigured) {
    return
  }

  const auth = getAuth(getFirebaseApp())
  await signOut(auth)
}

export async function deleteCurrentUser(): Promise<void> {
  if (!isFirebaseConfigured) {
    return
  }

  const auth = getAuth(getFirebaseApp())
  const user = auth.currentUser
  if (!user) {
    throw new Error('No signed-in user to delete.')
  }

  try {
    await user.delete()
  } catch (error) {
    if ((error as AuthError).code === 'auth/requires-recent-login') {
      throw new Error(
        'Please sign out and sign back in before deleting your account.',
      )
    }
    throw error
  }
}
