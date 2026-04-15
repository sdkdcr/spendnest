import { ZodError } from 'zod'
import { appDb } from '../../shared/db/appDb'
import { requestAutoSync } from '../../shared/sync/auto-sync'
import { backupPayloadSchema, type BackupPayload } from './backup.schema'

function formatValidationError(error: ZodError): string {
  const firstIssue = error.issues[0]
  if (!firstIssue) {
    return 'Backup validation failed.'
  }

  const pathText = firstIssue.path.length > 0 ? firstIssue.path.join('.') : 'root'
  return `Invalid backup at ${pathText}: ${firstIssue.message}`
}

export async function createBackupPayload(): Promise<BackupPayload> {
  const [families, persons, spendTemplates, monthlySpendEntries] = await Promise.all([
    appDb.families.toArray(),
    appDb.persons.toArray(),
    appDb.spendTemplates.toArray(),
    appDb.monthlySpendEntries.toArray(),
  ])

  return {
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    data: {
      families,
      persons,
      spendTemplates,
      monthlySpendEntries,
    },
  }
}

export function serializeBackup(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2)
}

export function parseBackupJson(rawJson: string): BackupPayload {
  let parsed: unknown

  try {
    parsed = JSON.parse(rawJson)
  } catch {
    throw new Error('Invalid JSON file. Please upload a valid backup file.')
  }

  const result = backupPayloadSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(formatValidationError(result.error))
  }

  return result.data
}

export async function restoreBackup(payload: BackupPayload): Promise<void> {
  await appDb.transaction(
    'rw',
    appDb.families,
    appDb.persons,
    appDb.spendTemplates,
    appDb.monthlySpendEntries,
    async () => {
      await appDb.monthlySpendEntries.clear()
      await appDb.spendTemplates.clear()
      await appDb.persons.clear()
      await appDb.families.clear()

      if (payload.data.families.length > 0) {
        await appDb.families.bulkPut(payload.data.families)
      }

      if (payload.data.persons.length > 0) {
        await appDb.persons.bulkPut(payload.data.persons)
      }

      if (payload.data.spendTemplates.length > 0) {
        await appDb.spendTemplates.bulkPut(payload.data.spendTemplates)
      }

      if (payload.data.monthlySpendEntries.length > 0) {
        await appDb.monthlySpendEntries.bulkPut(payload.data.monthlySpendEntries)
      }
    },
  )
  requestAutoSync()
}

export async function exportBackupFile(): Promise<void> {
  const payload = await createBackupPayload()
  const jsonContent = serializeBackup(payload)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const fileName = `spendnest-backup-${new Date().toISOString().slice(0, 10)}.json`

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()

  URL.revokeObjectURL(url)
}
