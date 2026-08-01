import type { SpendPlan, StepChange } from '../domain/types'

// Shape of a spendPlans row before the v3->v4 categories migration: it still
// carries the free-text `type` field instead of `categoryId`. Used as the
// intermediate result of migrateLegacySpendTemplates, since SpendPlan itself
// no longer has a `type` field to migrate into.
export type LegacySpendPlanWithType = Omit<SpendPlan, 'categoryId'> & {
  type: string
}

export interface LegacySpendTemplate {
  id?: number
  familyId: number
  personId?: number
  type: string
  name: string
  frequency: SpendPlan['frequency']
  cost: number
  quantity: string
  emiAmount?: number
  deductionDayOfMonth?: number
  emiEndMonth?: string
  startMonth?: string
  createdAt: string
  updatedAt: string
}

export interface LegacyMonthlySpendEntry {
  id?: number
  familyId: number
  templateId: number
  personId?: number
  monthKey: string
  type: string
  name: string
  cost: number
  quantity: string
  status: string
  usage: number
  manuallyUpdatedStatus: boolean
  createdAt: string
  updatedAt: string
}

function buildStepsFromHistory(
  templateId: number | undefined,
  baseBudget: number,
  entries: LegacyMonthlySpendEntry[],
): StepChange[] {
  if (templateId === undefined) {
    return []
  }

  const historyForTemplate = entries
    .filter((entry) => entry.templateId === templateId)
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))

  const steps: StepChange[] = []
  let priorCost = baseBudget

  for (const entry of historyForTemplate) {
    if (entry.cost !== priorCost) {
      steps.push({ effectiveDate: entry.monthKey, amount: entry.cost })
      priorCost = entry.cost
    }
  }

  return steps
}

// Fold each legacy template's per-month cost history into a steps[] array, per
// docs/DB_SCHEMA.md section 5. Shared by the Dexie v2->v3 upgrade and by backup
// import of old (backupVersion 1) files so both migration paths stay identical.
export function migrateLegacySpendTemplates(
  templates: LegacySpendTemplate[],
  entries: LegacyMonthlySpendEntry[],
): LegacySpendPlanWithType[] {
  return templates.map((template) => ({
    id: template.id,
    familyId: template.familyId,
    personId: template.personId,
    type: template.type,
    name: template.name,
    frequency: template.frequency,
    baseBudget: template.cost,
    startMonth: template.startMonth ?? template.createdAt.slice(0, 7),
    endDate: template.emiEndMonth,
    dayOfDeduction: template.deductionDayOfMonth,
    quantity: template.quantity,
    steps: buildStepsFromHistory(template.id, template.cost, entries),
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  }))
}
