import { appDb } from '../../shared/db/appDb'
import { touchFamilyLastModified } from '../../shared/db/touchFamily'
import { generateClientId } from '../../shared/domain/id'
import type { SpendFrequency, SpendPlan, StepChange } from '../../shared/domain/types'
import { requestAutoSync } from '../../shared/sync/auto-sync'

function nowIso(): string {
  return new Date().toISOString()
}

export interface SpendPlanDraft {
  personId?: number
  categoryId: number
  name: string
  frequency: SpendFrequency
  baseBudget: number
  startMonth: string
  endDate?: string
  dayOfDeduction?: number
  quantity: string
  steps: StepChange[]
}

export async function listSpendPlansByFamily(
  familyId: number,
): Promise<SpendPlan[]> {
  return appDb.spendPlans
    .where('familyId')
    .equals(familyId)
    .reverse()
    .sortBy('updatedAt')
}

export async function createSpendPlan(
  familyId: number,
  draft: SpendPlanDraft,
): Promise<SpendPlan> {
  const timestamp = nowIso()
  const id = generateClientId()
  const nextPlan: SpendPlan = {
    id,
    familyId,
    personId: draft.personId,
    categoryId: draft.categoryId,
    name: draft.name,
    frequency: draft.frequency,
    baseBudget: draft.baseBudget,
    startMonth: draft.startMonth,
    endDate: draft.endDate,
    dayOfDeduction: draft.dayOfDeduction,
    quantity: draft.quantity,
    steps: draft.steps,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await appDb.transaction('rw', appDb.spendPlans, appDb.families, async () => {
    await appDb.spendPlans.put(nextPlan)
    await touchFamilyLastModified(familyId, timestamp)
  })
  requestAutoSync()

  return nextPlan
}

export async function updateSpendPlan(
  planId: number,
  familyId: number,
  draft: SpendPlanDraft,
): Promise<void> {
  const timestamp = nowIso()
  await appDb.transaction('rw', appDb.spendPlans, appDb.families, async () => {
    await appDb.spendPlans.update(planId, {
      personId: draft.personId,
      categoryId: draft.categoryId,
      name: draft.name,
      frequency: draft.frequency,
      baseBudget: draft.baseBudget,
      startMonth: draft.startMonth,
      endDate: draft.endDate,
      dayOfDeduction: draft.dayOfDeduction,
      quantity: draft.quantity,
      steps: draft.steps,
      updatedAt: timestamp,
    })
    await touchFamilyLastModified(familyId, timestamp)
  })
  requestAutoSync()
}

export async function deleteSpendPlan(
  planId: number,
  familyId: number,
): Promise<void> {
  await appDb.transaction('rw', appDb.spendPlans, appDb.families, async () => {
    await appDb.spendPlans.delete(planId)
    await touchFamilyLastModified(familyId, nowIso())
  })
  requestAutoSync()
}
