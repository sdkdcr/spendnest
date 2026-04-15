import { appDb } from '../../shared/db/appDb'
import type { Family } from '../../shared/domain/types'
import { requestAutoSync } from '../../shared/sync/auto-sync'

function nowIso(): string {
  return new Date().toISOString()
}

export async function listFamilies(): Promise<Family[]> {
  return appDb.families.orderBy('updatedAt').reverse().toArray()
}

export async function createFamily(name: string): Promise<Family> {
  const timestamp = nowIso()
  const nextFamily: Family = {
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const id = await appDb.families.add(nextFamily)
  requestAutoSync()

  return {
    ...nextFamily,
    id,
  }
}

export async function renameFamily(
  familyId: number,
  name: string,
): Promise<void> {
  await appDb.families.update(familyId, {
    name,
    updatedAt: nowIso(),
  })
  requestAutoSync()
}

export async function deleteFamily(familyId: number): Promise<void> {
  await appDb.transaction(
    'rw',
    appDb.families,
    appDb.persons,
    appDb.spendTemplates,
    appDb.monthlySpendEntries,
    async () => {
      await appDb.monthlySpendEntries.where('familyId').equals(familyId).delete()
      await appDb.spendTemplates.where('familyId').equals(familyId).delete()
      await appDb.persons.where('familyId').equals(familyId).delete()
      await appDb.families.delete(familyId)
    },
  )
  requestAutoSync()
}
