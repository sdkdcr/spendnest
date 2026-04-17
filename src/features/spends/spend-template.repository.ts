import { appDb } from '../../shared/db/appDb'
import { generateClientId } from '../../shared/domain/id'
import type { SpendFrequency, SpendTemplate } from '../../shared/domain/types'
import { requestAutoSync } from '../../shared/sync/auto-sync'

function nowIso(): string {
  return new Date().toISOString()
}

export interface SpendTemplateDraft {
  personId?: number
  type: string
  name: string
  frequency: SpendFrequency
  cost: number
  quantity: string
  emiAmount?: number
  deductionDayOfMonth?: number
}

export async function listSpendTemplatesByFamily(
  familyId: number,
): Promise<SpendTemplate[]> {
  return appDb.spendTemplates
    .where('familyId')
    .equals(familyId)
    .reverse()
    .sortBy('updatedAt')
}

export async function createSpendTemplate(
  familyId: number,
  draft: SpendTemplateDraft,
): Promise<SpendTemplate> {
  const timestamp = nowIso()
  const id = generateClientId()
  const nextTemplate: SpendTemplate = {
    id,
    familyId,
    personId: draft.personId,
    type: draft.type,
    name: draft.name,
    frequency: draft.frequency,
    cost: draft.cost,
    quantity: draft.quantity,
    emiAmount: draft.emiAmount,
    deductionDayOfMonth: draft.deductionDayOfMonth,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await appDb.spendTemplates.put(nextTemplate)
  requestAutoSync()

  return nextTemplate
}

export async function updateSpendTemplate(
  templateId: number,
  draft: SpendTemplateDraft,
): Promise<void> {
  const timestamp = nowIso()
  await appDb.transaction('rw', appDb.spendTemplates, appDb.monthlySpendEntries, async () => {
    await appDb.spendTemplates.update(templateId, {
      personId: draft.personId,
      type: draft.type,
      name: draft.name,
      frequency: draft.frequency,
      cost: draft.cost,
      quantity: draft.quantity,
      emiAmount: draft.emiAmount,
      deductionDayOfMonth: draft.deductionDayOfMonth,
      updatedAt: timestamp,
    })
    await appDb.monthlySpendEntries
      .where('templateId')
      .equals(templateId)
      .modify({ name: draft.name, type: draft.type, updatedAt: timestamp })
  })
  requestAutoSync()
}

export async function deleteSpendTemplate(templateId: number): Promise<void> {
  await appDb.transaction(
    'rw',
    appDb.spendTemplates,
    appDb.monthlySpendEntries,
    async () => {
      await appDb.monthlySpendEntries.where('templateId').equals(templateId).delete()
      await appDb.spendTemplates.delete(templateId)
    },
  )
  requestAutoSync()
}
