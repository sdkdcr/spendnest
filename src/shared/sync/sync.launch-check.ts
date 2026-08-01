import { appDb } from '../db/appDb'
import { getCloudFamilyDoc } from '../firebase/firestore.family-sync'

export type LaunchSyncOutcome = 'in-sync' | 'auto-pulled' | 'needs-banner' | 'no-families'

// Compares the local lastModifiedAt watermark against each cloud-linked family's
// mirror (4.7.1). Unset local watermark means "no local changes yet" — auto-pull
// silently if the cloud has any data, otherwise there's nothing to reconcile.
export async function evaluateLaunchSyncState(): Promise<LaunchSyncOutcome> {
  const families = await appDb.families.toArray()
  const cloudLinkedFamilies = families.filter(
    (family): family is typeof family & { cloudFamilyId: string } =>
      typeof family.cloudFamilyId === 'string',
  )

  if (cloudLinkedFamilies.length === 0) {
    return 'no-families'
  }

  let anyMismatch = false
  let anyUnsetWithCloudData = false

  for (const family of cloudLinkedFamilies) {
    const cloudDoc = await getCloudFamilyDoc(family.cloudFamilyId)

    if (family.lastModifiedAt === undefined) {
      if (cloudDoc) {
        anyUnsetWithCloudData = true
      }
      continue
    }

    if (cloudDoc?.lastModifiedAt !== family.lastModifiedAt) {
      anyMismatch = true
    }
  }

  if (anyMismatch) {
    return 'needs-banner'
  }

  if (anyUnsetWithCloudData) {
    return 'auto-pulled'
  }

  return 'in-sync'
}
