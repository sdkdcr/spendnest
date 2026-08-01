import { appDb } from '../../shared/db/appDb'
import { touchFamilyLastModified } from '../../shared/db/touchFamily'
import { generateClientId } from '../../shared/domain/id'
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
  const id = generateClientId()
  const nextPerson: Person = {
    id,
    familyId,
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await appDb.transaction('rw', appDb.persons, appDb.families, async () => {
    await appDb.persons.put(nextPerson)
    await touchFamilyLastModified(familyId, timestamp)
  })
  requestAutoSync()

  return nextPerson
}

export async function renamePerson(
  personId: number,
  familyId: number,
  name: string,
): Promise<void> {
  const timestamp = nowIso()
  await appDb.transaction('rw', appDb.persons, appDb.families, async () => {
    await appDb.persons.update(personId, { name, updatedAt: timestamp })
    await touchFamilyLastModified(familyId, timestamp)
  })
  requestAutoSync()
}

export async function deletePerson(
  personId: number,
  familyId: number,
): Promise<void> {
  const timestamp = nowIso()
  await appDb.transaction(
    'rw',
    appDb.persons,
    appDb.spendPlans,
    appDb.families,
    async () => {
      await appDb.spendPlans.where('personId').equals(personId).modify({
        personId: undefined,
        updatedAt: timestamp,
      })

      await appDb.persons.delete(personId)
      await touchFamilyLastModified(familyId, timestamp)
    },
  )
  requestAutoSync()
}
