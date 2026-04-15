import type { Table } from 'dexie'
import { appDb } from '../db/appDb'
import type {
  Family,
  MonthlySpendEntry,
  Person,
  SpendTemplate,
} from '../domain/types'
import { loadUserCloudData, pushUserCloudData } from '../firebase/firestore'

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

export async function pullCloudDataToLocal(uid: string): Promise<PullSummary> {
  const cloudData = await loadUserCloudData(uid)

  let mergedCount = 0

  await appDb.transaction(
    'rw',
    appDb.families,
    appDb.persons,
    appDb.spendTemplates,
    appDb.monthlySpendEntries,
    async () => {
      mergedCount += await mergeRemoteTable<Family>(appDb.families, cloudData.families)
      mergedCount += await mergeRemoteTable<Person>(appDb.persons, cloudData.persons)
      mergedCount += await mergeRemoteTable<SpendTemplate>(
        appDb.spendTemplates,
        cloudData.spendTemplates,
      )
      mergedCount += await mergeRemoteTable<MonthlySpendEntry>(
        appDb.monthlySpendEntries,
        cloudData.monthlySpendEntries,
      )
    },
  )

  return { pulled: mergedCount }
}

export async function pushLocalDataToCloud(uid: string): Promise<PushSummary> {
  const [families, persons, spendTemplates, monthlySpendEntries] = await Promise.all([
    appDb.families.toArray(),
    appDb.persons.toArray(),
    appDb.spendTemplates.toArray(),
    appDb.monthlySpendEntries.toArray(),
  ])

  const pushed = await pushUserCloudData(uid, {
    families,
    persons,
    spendTemplates,
    monthlySpendEntries,
  })

  return { pushed }
}

export async function syncUserData(uid: string): Promise<{ pulled: number; pushed: number }> {
  const pushSummary = await pushLocalDataToCloud(uid)
  const pullSummary = await pullCloudDataToLocal(uid)

  return {
    pushed: pushSummary.pushed,
    pulled: pullSummary.pulled,
  }
}
