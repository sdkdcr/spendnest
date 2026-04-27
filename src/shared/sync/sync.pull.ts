import type { Table } from 'dexie'
import { appDb } from '../db/appDb'
import { generateClientId } from '../domain/id'
import type { Family, MonthlySpendEntry, Person, SpendTemplate } from '../domain/types'
import { loadSharedFamilyData } from '../firebase/firestore'
import {
  normalizeEmail,
  parseTimestamp,
  type PullSummary,
  type TimestampedEntity,
} from './sync.helpers'

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
