import { ZodError } from 'zod'
import { appDb } from '../../shared/db/appDb'
import { migrateSpendPlanTypesToCategories } from '../../shared/db/category-migration'
import { migrateLegacySpendTemplates } from '../../shared/db/legacy-migration'
import { generateClientId } from '../../shared/domain/id'
import { requestAutoSync } from '../../shared/sync/auto-sync'
import {
  backupPayloadSchema,
  legacyV1BackupPayloadSchema,
  legacyV2BackupPayloadSchema,
  type BackupPayload,
} from './backup.schema'

const CURRENT_BACKUP_VERSION = 3

function formatValidationError(error: ZodError): string {
  const firstIssue = error.issues[0]
  if (!firstIssue) {
    return 'Backup validation failed.'
  }

  const pathText = firstIssue.path.length > 0 ? firstIssue.path.join('.') : 'root'
  return `Invalid backup at ${pathText}: ${firstIssue.message}`
}

export async function createBackupPayload(): Promise<BackupPayload> {
  const [families, persons, categories, spendPlans] = await Promise.all([
    appDb.families.toArray(),
    appDb.persons.toArray(),
    appDb.categories.toArray(),
    appDb.spendPlans.toArray(),
  ])

  return {
    backupVersion: CURRENT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      families,
      persons,
      categories,
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

  const legacyV2Result = legacyV2BackupPayloadSchema.safeParse(parsed)
  if (legacyV2Result.success) {
    const { categories, spendPlans } = migrateSpendPlanTypesToCategories(
      legacyV2Result.data.data.spendPlans,
      generateClientId,
      legacyV2Result.data.exportedAt,
    )

    return {
      backupVersion: CURRENT_BACKUP_VERSION,
      exportedAt: legacyV2Result.data.exportedAt,
      data: {
        families: legacyV2Result.data.data.families,
        persons: legacyV2Result.data.data.persons,
        categories,
        spendPlans,
      },
    }
  }

  const legacyV1Result = legacyV1BackupPayloadSchema.safeParse(parsed)
  if (legacyV1Result.success) {
    const migratedPlans = migrateLegacySpendTemplates(
      legacyV1Result.data.data.spendTemplates,
      legacyV1Result.data.data.monthlySpendEntries,
    )
    const { categories, spendPlans } = migrateSpendPlanTypesToCategories(
      migratedPlans,
      generateClientId,
      legacyV1Result.data.exportedAt,
    )

    return {
      backupVersion: CURRENT_BACKUP_VERSION,
      exportedAt: legacyV1Result.data.exportedAt,
      data: {
        families: legacyV1Result.data.data.families,
        persons: legacyV1Result.data.data.persons,
        categories,
        spendPlans,
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
    appDb.categories,
    appDb.spendPlans,
    async () => {
      await appDb.spendPlans.clear()
      await appDb.categories.clear()
      await appDb.persons.clear()
      await appDb.families.clear()

      if (payload.data.families.length > 0) {
        await appDb.families.bulkPut(payload.data.families)
      }

      if (payload.data.persons.length > 0) {
        await appDb.persons.bulkPut(payload.data.persons)
      }

      if (payload.data.categories.length > 0) {
        await appDb.categories.bulkPut(payload.data.categories)
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
