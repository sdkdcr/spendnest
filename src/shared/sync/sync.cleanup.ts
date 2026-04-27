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

  await appDb.transaction('rw', appDb.spendTemplates, appDb.monthlySpendEntries, async () => {
    await Promise.all([appDb.spendTemplates.clear(), appDb.monthlySpendEntries.clear()])
  })

  await Promise.all(
    cloudFamilyIds.flatMap((cloudFamilyId) => [
      deleteSubCollectionOrphans(cloudFamilyId, 'spendTemplates', new Set()),
      deleteSubCollectionOrphans(cloudFamilyId, 'monthlySpendEntries', new Set()),
    ]),
  )
}

export async function deregisterLocalAndCloud(): Promise<void> {
  const families = await appDb.families.toArray()
  const cloudFamilyIds = extractCloudFamilyIds(families)

  await appDb.transaction(
    'rw',
    appDb.families,
    appDb.persons,
    appDb.spendTemplates,
    appDb.monthlySpendEntries,
    async () => {
      await Promise.all([
        appDb.families.clear(),
        appDb.persons.clear(),
        appDb.spendTemplates.clear(),
        appDb.monthlySpendEntries.clear(),
      ])
    },
  )

  await Promise.all(
    cloudFamilyIds.flatMap((cloudFamilyId) => [
      deleteSubCollectionOrphans(cloudFamilyId, 'persons', new Set()),
      deleteSubCollectionOrphans(cloudFamilyId, 'spendTemplates', new Set()),
      deleteSubCollectionOrphans(cloudFamilyId, 'monthlySpendEntries', new Set()),
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
    const [localPersons, localTemplates, localEntries] = await Promise.all([
      appDb.persons.where('familyId').equals(family.id).toArray(),
      appDb.spendTemplates.where('familyId').equals(family.id).toArray(),
      appDb.monthlySpendEntries.where('familyId').equals(family.id).toArray(),
    ])

    const personIds = new Set(localPersons.map((p) => String(p.id)).filter(Boolean))
    const templateIds = new Set(localTemplates.map((t) => String(t.id)).filter(Boolean))
    const entryIds = new Set(localEntries.map((e) => String(e.id)).filter(Boolean))

    const [d1, d2, d3] = await Promise.all([
      deleteSubCollectionOrphans(family.cloudFamilyId, 'persons', personIds),
      deleteSubCollectionOrphans(family.cloudFamilyId, 'spendTemplates', templateIds),
      deleteSubCollectionOrphans(family.cloudFamilyId, 'monthlySpendEntries', entryIds),
    ])

    totalDeleted += d1 + d2 + d3
  }

  const { pushed } = await pushLocalDataToCloud(uid, normalizedEmail)
  return { deleted: totalDeleted, pushed }
}
