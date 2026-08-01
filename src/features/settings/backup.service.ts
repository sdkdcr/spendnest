import { ZodError } from 'zod'
import { appDb } from '../../shared/db/appDb'
import { migrateLegacySpendTemplates } from '../../shared/db/legacy-migration'
import { requestAutoSync } from '../../shared/sync/auto-sync'
import {
  backupPayloadSchema,
  legacyBackupPayloadSchema,
  type BackupPayload,
} from './backup.schema'

const CURRENT_BACKUP_VERSION = 2

function formatValidationError(error: ZodError): string {
  const firstIssue = error.issues[0]
  if (!firstIssue) {
    return 'Backup validation failed.'
  }

  const pathText = firstIssue.path.length > 0 ? firstIssue.path.join('.') : 'root'
  return `Invalid backup at ${pathText}: ${firstIssue.message}`
}

export async function createBackupPayload(): Promise<BackupPayload> {
  const [families, persons, spendPlans] = await Promise.all([
    appDb.families.toArray(),
    appDb.persons.toArray(),
    appDb.spendPlans.toArray(),
  ])

  return {
    backupVersion: CURRENT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      families,
      persons,
      spendPlans,
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

  const currentResult = backupPayloadSchema.safeParse(parsed)
  if (currentResult.success) {
    return currentResult.data
  }

  const legacyResult = legacyBackupPayloadSchema.safeParse(parsed)
  if (legacyResult.success) {
    const migratedPlans = migrateLegacySpendTemplates(
      legacyResult.data.data.spendTemplates,
      legacyResult.data.data.monthlySpendEntries,
    )

    return {
      backupVersion: CURRENT_BACKUP_VERSION,
      exportedAt: legacyResult.data.exportedAt,
      data: {
        families: legacyResult.data.data.families,
        persons: legacyResult.data.data.persons,
        spendPlans: migratedPlans,
      },
    }
  }

  throw new Error(formatValidationError(currentResult.error))
}

export async function restoreBackup(payload: BackupPayload): Promise<void> {
  await appDb.transaction(
    'rw',
    appDb.families,
    appDb.persons,
    appDb.spendPlans,
    async () => {
      await appDb.spendPlans.clear()
      await appDb.persons.clear()
      await appDb.families.clear()

      if (payload.data.families.length > 0) {
        await appDb.families.bulkPut(payload.data.families)
      }

      if (payload.data.persons.length > 0) {
        await appDb.persons.bulkPut(payload.data.persons)
      }

      if (payload.data.spendPlans.length > 0) {
        await appDb.spendPlans.bulkPut(payload.data.spendPlans)
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
