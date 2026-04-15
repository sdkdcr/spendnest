import { appDb } from '../shared/db/appDb'

let initialized = false

export async function bootstrapApp() {
  if (initialized) {
    return
  }

  await appDb.open()
  initialized = true
}
