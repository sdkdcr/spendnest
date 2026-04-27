import { appDb } from '../db/appDb'
import type { Family } from '../domain/types'
import { pushSharedFamilyData, type SharedFamilyBundle } from '../firebase/firestore'
import { buildCloudFamilyId, normalizeEmail, type PushSummary } from './sync.helpers'

export async function ensureFamiliesHaveCloudIds(
  uid: string,
  families: Family[],
): Promise<Family[]> {
  const nextFamilies: Family[] = []

  for (const family of families) {
    if (family.id === undefined) {
      nextFamilies.push(family)
      continue
    }

    if (family.cloudFamilyId) {
      nextFamilies.push(family)
      continue
    }

    const cloudFamilyId = buildCloudFamilyId(uid, family.id)
    const nextFamily = {
      ...family,
      cloudFamilyId,
      updatedAt: new Date().toISOString(),
    }

    await appDb.families.update(family.id, {
      cloudFamilyId,
      updatedAt: nextFamily.updatedAt,
    })

    nextFamilies.push(nextFamily)
  }

  return nextFamilies
}

export async function pushLocalDataToCloud(
  uid: string,
  email: string,
): Promise<PushSummary> {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    throw new Error('Signed-in user email is required for shared family sync.')
  }

  const [rawFamilies, persons, spendTemplates, monthlySpendEntries] = await Promise.all([
    appDb.families.toArray(),
    appDb.persons.toArray(),
    appDb.spendTemplates.toArray(),
    appDb.monthlySpendEntries.toArray(),
  ])

  const families = await ensureFamiliesHaveCloudIds(uid, rawFamilies)
  const cloudReadyFamilies = families.filter(
    (family): family is Family & { id: number; cloudFamilyId: string } =>
      typeof family.id === 'number' && typeof family.cloudFamilyId === 'string',
  )

  const bundles: SharedFamilyBundle[] = cloudReadyFamilies.map((family) => ({
    family,
    persons: persons.filter((person) => person.familyId === family.id),
    spendTemplates: spendTemplates.filter((template) => template.familyId === family.id),
    monthlySpendEntries: monthlySpendEntries.filter((entry) => entry.familyId === family.id),
  }))

  const pushed = await pushSharedFamilyData(uid, normalizedEmail, bundles)
  return { pushed }
}
