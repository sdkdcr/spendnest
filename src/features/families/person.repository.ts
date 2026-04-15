import { appDb } from '../../shared/db/appDb'
import type { Person } from '../../shared/domain/types'
import { requestAutoSync } from '../../shared/sync/auto-sync'

function nowIso(): string {
  return new Date().toISOString()
}

export async function listPersonsByFamily(familyId: number): Promise<Person[]> {
  return appDb.persons
    .where('familyId')
    .equals(familyId)
    .reverse()
    .sortBy('updatedAt')
}

export async function createPerson(
  familyId: number,
  name: string,
): Promise<Person> {
  const timestamp = nowIso()
  const nextPerson: Person = {
    familyId,
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const id = await appDb.persons.add(nextPerson)
  requestAutoSync()

  return {
    ...nextPerson,
    id,
  }
}

export async function renamePerson(personId: number, name: string): Promise<void> {
  await appDb.persons.update(personId, {
    name,
    updatedAt: nowIso(),
  })
  requestAutoSync()
}

export async function deletePerson(personId: number): Promise<void> {
  await appDb.transaction(
    'rw',
    appDb.persons,
    appDb.spendTemplates,
    appDb.monthlySpendEntries,
    async () => {
      await appDb.spendTemplates.where('personId').equals(personId).modify({
        personId: undefined,
        updatedAt: nowIso(),
      })

      await appDb.monthlySpendEntries.where('personId').equals(personId).modify({
        personId: undefined,
        updatedAt: nowIso(),
      })

      await appDb.persons.delete(personId)
    },
  )
  requestAutoSync()
}
