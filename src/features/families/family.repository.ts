import { appDb } from '../../shared/db/appDb'
import { generateClientId } from '../../shared/domain/id'
import type { Family } from '../../shared/domain/types'
import { requestAutoSync } from '../../shared/sync/auto-sync'

function nowIso(): string {
  return new Date().toISOString()
}

function normalizeMemberEmails(emails: string[]): string[] {
  return Array.from(
    new Set(
      emails
        .map((email) => email.trim())
        .filter((email) => email.length > 0),
    ),
  )
}

export async function listFamilies(): Promise<Family[]> {
  return appDb.families.orderBy('updatedAt').reverse().toArray()
}

export async function createFamily(
  name: string,
  memberEmails: string[] = [],
): Promise<Family> {
  const timestamp = nowIso()
  const id = generateClientId()
  const nextFamily: Family = {
    id,
    name,
    memberEmails: normalizeMemberEmails(memberEmails),
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await appDb.families.put(nextFamily)
  requestAutoSync()

  return nextFamily
}

export async function renameFamily(
  familyId: number,
  name: string,
  memberEmails?: string[],
): Promise<void> {
  const nextPatch: Partial<Family> = {
    name,
    updatedAt: nowIso(),
  }

  if (memberEmails) {
    nextPatch.memberEmails = normalizeMemberEmails(memberEmails)
  }

  await appDb.families.update(familyId, nextPatch)
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
