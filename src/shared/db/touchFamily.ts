import { appDb } from './appDb'

// Bumps the family sync watermark inside the caller's active Dexie transaction,
// so lastModifiedAt only advances alongside a real committed write (4.7.1).
export async function touchFamilyLastModified(
  familyId: number,
  timestamp: string,
): Promise<void> {
  await appDb.families.update(familyId, { lastModifiedAt: timestamp })
}
