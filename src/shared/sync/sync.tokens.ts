import { appDb } from '../db/appDb'
import { getCloudFamilyDoc, pushSharedFamilyData } from '../firebase/firestore.family-sync'

function nowIso(): string {
  return new Date().toISOString()
}

async function cloudLinkedFamilies() {
  const families = await appDb.families.toArray()
  return families.filter(
    (family): family is typeof family & { id: number; cloudFamilyId: string } =>
      typeof family.id === 'number' && typeof family.cloudFamilyId === 'string',
  )
}

// After "Discard local & pull from cloud" (4.7.2), the local watermark should
// match whatever the cloud doc already had — pulling doesn't change the cloud.
export async function syncLocalTokensFromCloud(): Promise<void> {
  const families = await cloudLinkedFamilies()

  for (const family of families) {
    const cloudDoc = await getCloudFamilyDoc(family.cloudFamilyId)
    await appDb.families.update(family.id, {
      lastModifiedAt: cloudDoc?.lastModifiedAt ?? nowIso(),
    })
  }
}

// After "Override cloud with local changes" (4.7.2), the cloud doc's watermark
// should match local so the next launch check sees them as in sync.
export async function syncCloudTokensFromLocal(uid: string, email: string): Promise<void> {
  const families = await cloudLinkedFamilies()
  const timestamp = nowIso()

  for (const family of families) {
    await appDb.families.update(family.id, { lastModifiedAt: timestamp })
  }

  const refreshedFamilies = await cloudLinkedFamilies()
  const persons = await appDb.persons.toArray()
  const categories = await appDb.categories.toArray()
  const spendPlans = await appDb.spendPlans.toArray()

  await pushSharedFamilyData(
    uid,
    email,
    refreshedFamilies.map((family) => ({
      family,
      persons: persons.filter((person) => person.familyId === family.id),
      categories: categories.filter((category) => category.familyId === family.id),
      spendPlans: spendPlans.filter((plan) => plan.familyId === family.id),
    })),
  )
}
