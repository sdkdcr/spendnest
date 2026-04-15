import type { Table } from 'dexie'
import { appDb } from '../db/appDb'
import { generateClientId } from '../domain/id'
import type {
  Family,
  MonthlySpendEntry,
  Person,
  SpendTemplate,
} from '../domain/types'
import {
  loadSharedFamilyData,
  pushSharedFamilyData,
  type SharedFamilyBundle,
} from '../firebase/firestore'

interface TimestampedEntity {
  id?: number
  updatedAt: string
}

interface PullSummary {
  pulled: number
}

interface PushSummary {
  pushed: number
}

function parseTimestamp(value: string): number {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function normalizeEmail(email: string): string {
  return email.trim()
}

function buildCloudFamilyId(uid: string, familyId: number): string {
  return `family_${uid}_${familyId}`
}

async function ensureFamiliesHaveCloudIds(
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

async function mergeRemoteTable<T extends TimestampedEntity>(
  table: Table<T, number>,
  remoteRecords: T[],
): Promise<number> {
  let mergedCount = 0

  for (const remoteRecord of remoteRecords) {
    if (typeof remoteRecord.id !== 'number') {
      continue
    }

    const localRecord = await table.get(remoteRecord.id)
    if (!localRecord) {
      await table.put(remoteRecord)
      mergedCount += 1
      continue
    }

    const remoteUpdatedAt = parseTimestamp(remoteRecord.updatedAt)
    const localUpdatedAt = parseTimestamp(localRecord.updatedAt)

    if (remoteUpdatedAt >= localUpdatedAt) {
      await table.put(remoteRecord)
      mergedCount += 1
    }
  }

  return mergedCount
}

async function resolveLocalFamily(family: Family): Promise<Family> {
  if (!family.cloudFamilyId) {
    throw new Error('Remote family is missing cloudFamilyId.')
  }

  const existingLocal = await appDb.families
    .where('cloudFamilyId')
    .equals(family.cloudFamilyId)
    .first()

  if (!existingLocal) {
    const nextFamily: Family = {
      id: generateClientId(),
      name: family.name,
      cloudFamilyId: family.cloudFamilyId,
      memberEmails: family.memberEmails,
      createdAt: family.createdAt,
      updatedAt: family.updatedAt,
    }

    await appDb.families.put(nextFamily)
    return nextFamily
  }

  const remoteUpdatedAt = parseTimestamp(family.updatedAt)
  const localUpdatedAt = parseTimestamp(existingLocal.updatedAt)

  if (remoteUpdatedAt >= localUpdatedAt) {
    const mergedFamily: Family = {
      ...existingLocal,
      name: family.name,
      memberEmails: family.memberEmails,
      cloudFamilyId: family.cloudFamilyId,
      createdAt: family.createdAt,
      updatedAt: family.updatedAt,
    }

    await appDb.families.put(mergedFamily)
    return mergedFamily
  }

  return existingLocal
}

export async function pullCloudDataToLocal(email: string): Promise<PullSummary> {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    throw new Error('Signed-in user email is required for shared family sync.')
  }

  const familyBundles = await loadSharedFamilyData(normalizedEmail)

  let mergedCount = 0

  await appDb.transaction(
    'rw',
    appDb.families,
    appDb.persons,
    appDb.spendTemplates,
    appDb.monthlySpendEntries,
    async () => {
      for (const bundle of familyBundles) {
        const localFamily = await resolveLocalFamily(bundle.family)
        const localFamilyId = localFamily.id

        if (localFamilyId === undefined) {
          continue
        }

        const localizedPersons = bundle.persons.map((person) => ({
          ...person,
          familyId: localFamilyId,
        }))

        const localizedTemplates = bundle.spendTemplates.map((template) => ({
          ...template,
          familyId: localFamilyId,
        }))

        const localizedEntries = bundle.monthlySpendEntries.map((entry) => ({
          ...entry,
          familyId: localFamilyId,
        }))

        mergedCount += await mergeRemoteTable<Person>(appDb.persons, localizedPersons)
        mergedCount += await mergeRemoteTable<SpendTemplate>(
          appDb.spendTemplates,
          localizedTemplates,
        )
        mergedCount += await mergeRemoteTable<MonthlySpendEntry>(
          appDb.monthlySpendEntries,
          localizedEntries,
        )
      }
    },
  )

  return { pulled: mergedCount }
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
    (family): family is Family & { id: number; cloudFamilyId: string } => {
      return typeof family.id === 'number' && typeof family.cloudFamilyId === 'string'
    },
  )

  const bundles: SharedFamilyBundle[] = cloudReadyFamilies.map((family) => {
    return {
      family,
      persons: persons.filter((person) => person.familyId === family.id),
      spendTemplates: spendTemplates.filter((template) => template.familyId === family.id),
      monthlySpendEntries: monthlySpendEntries.filter(
        (entry) => entry.familyId === family.id,
      ),
    }
  })

  const pushed = await pushSharedFamilyData(uid, normalizedEmail, bundles)

  return { pushed }
}

export async function syncUserData(
  uid: string,
  email: string,
): Promise<{ pulled: number; pushed: number }> {
  const pushSummary = await pushLocalDataToCloud(uid, email)
  const pullSummary = await pullCloudDataToLocal(email)

  return {
    pushed: pushSummary.pushed,
    pulled: pullSummary.pulled,
  }
}
