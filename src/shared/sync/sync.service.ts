export { pullCloudDataToLocal } from './sync.pull'
export { pushLocalDataToCloud } from './sync.push'
export { clearSpendsLocalAndCloud, deregisterLocalAndCloud, repairCloudData } from './sync.cleanup'

import { pushLocalDataToCloud } from './sync.push'
import { pullCloudDataToLocal } from './sync.pull'

export async function syncUserData(
  uid: string,
  email: string,
): Promise<{ pulled: number; pushed: number }> {
  let pushed: number
  try {
    const result = await pushLocalDataToCloud(uid, email)
    pushed = result.pushed
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown push error'
    throw new Error(`Cloud push failed: ${detail}`)
  }

  let pulled: number
  try {
    const result = await pullCloudDataToLocal(email)
    pulled = result.pulled
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown pull error'
    throw new Error(`Cloud pull failed: ${detail}`)
  }

  return { pushed, pulled }
}
