import { appDb } from '../shared/db/appDb'
import { subscribeAuthState } from '../shared/firebase/auth'
import { isFirebaseConfigured } from '../shared/firebase/firebaseApp'
import { useAppStore } from '../shared/state/useAppStore'

let initialized = false
let stopAuthSubscription: (() => void) | null = null

async function ensureSelectedFamily(): Promise<void> {
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

export async function bootstrapApp() {
  if (initialized) {
    return
  }

  await appDb.open()
  await ensureSelectedFamily()

  if (isFirebaseConfigured && stopAuthSubscription === null) {
    useAppStore.getState().setAuthReady(false)

    stopAuthSubscription = subscribeAuthState((user) => {
      const appState = useAppStore.getState()
      appState.setAuthSession(user)
      appState.setAuthReady(true)
      appState.setAuthError(null)

      if (!user) {
        appState.setSyncState('idle', 'Sign in to enable cloud sync.')
        return
      }

      appState.setSyncState('idle', 'Signed in. Click "Sync now" to sync data.')
    })
  }

  initialized = true
}
