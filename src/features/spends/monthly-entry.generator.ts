import { appDb } from '../../shared/db/appDb'
import type { MonthlySpendEntry, SpendTemplate } from '../../shared/domain/types'
import { isTemplateEligibleForMonth } from './frequency.rules'

export interface MonthlyGenerationResult {
  createdCount: number
  existingCount: number
  eligibleCount: number
  templateCount: number
}

function nowIso(): string {
  return new Date().toISOString()
}

function createMonthlyEntry(
  template: SpendTemplate,
  monthKey: string,
  cost: number,
): MonthlySpendEntry {
  const timestamp = nowIso()

  return {
    familyId: template.familyId,
    templateId: template.id as number,
    personId: template.personId,
    monthKey,
    type: template.type,
    name: template.name,
    cost,
    quantity: template.quantity,
    status: 'Not Yet',
    usage: 0,
    manuallyUpdatedStatus: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

async function resolveCostForMonth(
  template: SpendTemplate,
  monthKey: string,
): Promise<number> {
  if (template.id === undefined) {
    return template.cost
  }

  const priorEntries = await appDb.monthlySpendEntries
    .where('templateId')
    .equals(template.id)
    .and((entry) => entry.monthKey < monthKey)
    .toArray()

  if (priorEntries.length === 0) {
    return template.cost
  }

  const latestPriorEntry = priorEntries.sort((a, b) =>
    a.monthKey.localeCompare(b.monthKey),
  )[priorEntries.length - 1]

  return latestPriorEntry.cost
}

export async function ensureMonthlyEntries(
  familyId: number,
  monthKey: string,
): Promise<MonthlyGenerationResult> {
  return appDb.transaction(
    'rw',
    appDb.spendTemplates,
    appDb.monthlySpendEntries,
    async () => {
      const templates = await appDb.spendTemplates
        .where('familyId')
        .equals(familyId)
        .toArray()

      const eligibleTemplates = templates.filter((template) => {
        return isTemplateEligibleForMonth(template, monthKey)
      })

      const existingEntries = await appDb.monthlySpendEntries
        .where('familyId')
        .equals(familyId)
        .and((entry) => entry.monthKey === monthKey)
        .toArray()

      const existingTemplateIds = new Set(
        existingEntries.map((entry) => entry.templateId),
      )

      const missingTemplates = eligibleTemplates.filter((template) => {
        return template.id !== undefined && !existingTemplateIds.has(template.id)
      })

      const missingEntries = await Promise.all(
        missingTemplates.map(async (template) => {
          const resolvedCost = await resolveCostForMonth(template, monthKey)
          return createMonthlyEntry(template, monthKey, resolvedCost)
        }),
      )

      if (missingEntries.length > 0) {
        await appDb.monthlySpendEntries.bulkAdd(missingEntries)
      }

      return {
        createdCount: missingEntries.length,
        existingCount: existingEntries.length,
        eligibleCount: eligibleTemplates.length,
        templateCount: templates.length,
      }
    },
  )
}
