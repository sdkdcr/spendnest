import { appDb } from '../../shared/db/appDb'
import type { MonthlySpendEntry, MonthlySpendStatus } from '../../shared/domain/types'
import { requestAutoSync } from '../../shared/sync/auto-sync'

function nowIso(): string {
  return new Date().toISOString()
}

export async function listMonthlyEntries(
  familyId: number,
  monthKey: string,
): Promise<MonthlySpendEntry[]> {
  const entries = await appDb.monthlySpendEntries
    .where('familyId')
    .equals(familyId)
    .and((entry) => entry.monthKey === monthKey)
    .toArray()

  return entries.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name)
    }

    return a.type.localeCompare(b.type)
  })
}

export async function updateMonthlyEntryStatus(
  entryId: number,
  status: MonthlySpendStatus,
): Promise<void> {
  await appDb.monthlySpendEntries.update(entryId, {
    status,
    manuallyUpdatedStatus: true,
    updatedAt: nowIso(),
  })
  requestAutoSync()
}

interface MonthlyEntryDetailsPatch {
  cost: number
  quantity: string
}

export async function updateMonthlyEntryDetails(
  entryId: number,
  patch: MonthlyEntryDetailsPatch,
): Promise<void> {
  await appDb.monthlySpendEntries.update(entryId, {
    cost: patch.cost,
    quantity: patch.quantity,
    updatedAt: nowIso(),
  })
  requestAutoSync()
}

function parseMonthKey(monthKey: string): { year: number; month: number } | null {
  const [yearToken, monthToken] = monthKey.split('-')
  const year = Number(yearToken)
  const month = Number(monthToken)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null
  }

  return { year, month }
}

function isDeductionDateReached(
  monthKey: string,
  deductionDayOfMonth: number,
  referenceDate: Date,
): boolean {
  const parsedMonth = parseMonthKey(monthKey)
  if (!parsedMonth) {
    return false
  }

  const referenceYear = referenceDate.getFullYear()
  const referenceMonth = referenceDate.getMonth() + 1
  const referenceDay = referenceDate.getDate()

  if (
    referenceYear > parsedMonth.year ||
    (referenceYear === parsedMonth.year && referenceMonth > parsedMonth.month)
  ) {
    return true
  }

  if (
    referenceYear < parsedMonth.year ||
    (referenceYear === parsedMonth.year && referenceMonth < parsedMonth.month)
  ) {
    return false
  }

  return referenceDay >= deductionDayOfMonth
}

export async function applyEmiAutoStatus(
  familyId: number,
  monthKey: string,
): Promise<number> {
  const referenceDate = new Date()

  const updatedCount = await appDb.transaction(
    'rw',
    appDb.monthlySpendEntries,
    appDb.spendTemplates,
    async () => {
      const entries = await appDb.monthlySpendEntries
        .where('familyId')
        .equals(familyId)
        .and((entry) => entry.monthKey === monthKey)
        .toArray()

      const templateIds = Array.from(new Set(entries.map((entry) => entry.templateId)))
      const templates = await appDb.spendTemplates.bulkGet(templateIds)
      const templateById = new Map<number, (typeof templates)[number]>()

      templateIds.forEach((templateId, index) => {
        templateById.set(templateId, templates[index])
      })

      let updatedCount = 0

      for (const entry of entries) {
        if (entry.id === undefined) {
          continue
        }

        if (entry.manuallyUpdatedStatus || entry.status === 'Spent') {
          continue
        }

        const template = templateById.get(entry.templateId)
        if (!template || template.deductionDayOfMonth === undefined) {
          continue
        }

        const shouldAutoMarkSpent = isDeductionDateReached(
          monthKey,
          template.deductionDayOfMonth,
          referenceDate,
        )

        if (!shouldAutoMarkSpent) {
          continue
        }

        await appDb.monthlySpendEntries.update(entry.id, {
          status: 'Spent',
          updatedAt: nowIso(),
        })

        updatedCount += 1
      }

      return updatedCount
    },
  )

  if (updatedCount > 0) {
    requestAutoSync()
  }

  return updatedCount
}
