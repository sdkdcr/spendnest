import { appDb } from '../../shared/db/appDb'
import type { SpendFrequency, SpendTemplate } from '../../shared/domain/types'

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
  const nextTemplate: SpendTemplate = {
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

  const id = await appDb.spendTemplates.add(nextTemplate)

  return {
    ...nextTemplate,
    id,
  }
}

export async function updateSpendTemplate(
  templateId: number,
  draft: SpendTemplateDraft,
): Promise<void> {
  await appDb.spendTemplates.update(templateId, {
    personId: draft.personId,
    type: draft.type,
    name: draft.name,
    frequency: draft.frequency,
    cost: draft.cost,
    quantity: draft.quantity,
    emiAmount: draft.emiAmount,
    deductionDayOfMonth: draft.deductionDayOfMonth,
    updatedAt: nowIso(),
  })
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
}
