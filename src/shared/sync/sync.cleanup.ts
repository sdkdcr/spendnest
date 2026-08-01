import { appDb } from '../db/appDb'
import { deleteCloudFamilyDoc, deleteSubCollectionOrphans } from '../firebase/firestore'
import { normalizeEmail } from './sync.helpers'
import { ensureFamiliesHaveCloudIds, pushLocalDataToCloud } from './sync.push'

function extractCloudFamilyIds(families: { cloudFamilyId?: string }[]): string[] {
  return families
    .map((f) => f.cloudFamilyId)
    .filter((id): id is string => typeof id === 'string')
}

export async function clearSpendsLocalAndCloud(): Promise<void> {
  const families = await appDb.families.toArray()
  const cloudFamilyIds = extractCloudFamilyIds(families)

  await appDb.transaction('rw', appDb.spendPlans, async () => {
    await appDb.spendPlans.clear()
  })

  await Promise.all(
    cloudFamilyIds.map((cloudFamilyId) =>
      deleteSubCollectionOrphans(cloudFamilyId, 'spendPlans', new Set()),
    ),
  )
}

export async function deregisterLocalAndCloud(): Promise<void> {
  const families = await appDb.families.toArray()
  const cloudFamilyIds = extractCloudFamilyIds(families)

  await appDb.transaction(
    'rw',
    appDb.families,
    appDb.persons,
    appDb.categories,
    appDb.spendPlans,
    async () => {
      await Promise.all([
        appDb.families.clear(),
        appDb.persons.clear(),
        appDb.categories.clear(),
        appDb.spendPlans.clear(),
      ])
    },
  )

  await Promise.all(
    cloudFamilyIds.flatMap((cloudFamilyId) => [
      deleteSubCollectionOrphans(cloudFamilyId, 'persons', new Set()),
      deleteSubCollectionOrphans(cloudFamilyId, 'categories', new Set()),
      deleteSubCollectionOrphans(cloudFamilyId, 'spendPlans', new Set()),
      deleteCloudFamilyDoc(cloudFamilyId),
    ]),
  )
}

export async function repairCloudData(
  uid: string,
  email: string,
): Promise<{ deleted: number; pushed: number }> {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    throw new Error('Signed-in user email is required for cloud repair.')
  }

  const rawFamilies = await appDb.families.toArray()
  const families = await ensureFamiliesHaveCloudIds(uid, rawFamilies)
  const cloudReadyFamilies = families.filter(
    (family): family is typeof family & { id: number; cloudFamilyId: string } =>
      typeof family.id === 'number' && typeof family.cloudFamilyId === 'string',
  )

  let totalDeleted = 0

  for (const family of cloudReadyFamilies) {
    const [localPersons, localCategories, localPlans] = await Promise.all([
      appDb.persons.where('familyId').equals(family.id).toArray(),
      appDb.categories.where('familyId').equals(family.id).toArray(),
      appDb.spendPlans.where('familyId').equals(family.id).toArray(),
    ])

    const personIds = new Set(localPersons.map((p) => String(p.id)).filter(Boolean))
    const categoryIds = new Set(localCategories.map((c) => String(c.id)).filter(Boolean))
    const planIds = new Set(localPlans.map((p) => String(p.id)).filter(Boolean))

    const [d1, d2, d3] = await Promise.all([
      deleteSubCollectionOrphans(family.cloudFamilyId, 'persons', personIds),
      deleteSubCollectionOrphans(family.cloudFamilyId, 'categories', categoryIds),
      deleteSubCollectionOrphans(family.cloudFamilyId, 'spendPlans', planIds),
    ])

    totalDeleted += d1 + d2 + d3
  }

  const { pushed } = await pushLocalDataToCloud(uid, normalizedEmail)
  return { deleted: totalDeleted, pushed }
}
