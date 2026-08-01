import { appDb } from '../../shared/db/appDb'
import { touchFamilyLastModified } from '../../shared/db/touchFamily'
import { generateClientId } from '../../shared/domain/id'
import type { Category } from '../../shared/domain/types'
import { requestAutoSync } from '../../shared/sync/auto-sync'
import { pickNextCategoryColor } from './category-colors'

function nowIso(): string {
  return new Date().toISOString()
}

export async function listCategoriesByFamily(familyId: number): Promise<Category[]> {
  return appDb.categories
    .where('familyId')
    .equals(familyId)
    .reverse()
    .sortBy('updatedAt')
}

export async function countPlansUsingCategory(categoryId: number): Promise<number> {
  return appDb.spendPlans.where('categoryId').equals(categoryId).count()
}

export async function createCategory(
  familyId: number,
  name: string,
): Promise<Category> {
  const timestamp = nowIso()
  const existingCategories = await listCategoriesByFamily(familyId)
  const nextCategory: Category = {
    id: generateClientId(),
    familyId,
    name,
    color: pickNextCategoryColor(existingCategories),
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await appDb.transaction('rw', appDb.categories, appDb.families, async () => {
    await appDb.categories.put(nextCategory)
    await touchFamilyLastModified(familyId, timestamp)
  })
  requestAutoSync()

  return nextCategory
}

export async function renameCategory(
  categoryId: number,
  familyId: number,
  name: string,
): Promise<void> {
  const timestamp = nowIso()
  await appDb.transaction('rw', appDb.categories, appDb.families, async () => {
    await appDb.categories.update(categoryId, { name, updatedAt: timestamp })
    await touchFamilyLastModified(familyId, timestamp)
  })
  requestAutoSync()
}

export interface RetirementSettings {
  isRetirementCorpus: boolean
  retirementCurrentBalance?: number
  retirementAnnualGrowthRatePercent?: number
}

export async function updateRetirementSettings(
  categoryId: number,
  familyId: number,
  settings: RetirementSettings,
): Promise<void> {
  const timestamp = nowIso()
  await appDb.transaction('rw', appDb.categories, appDb.families, async () => {
    await appDb.categories.update(categoryId, { ...settings, updatedAt: timestamp })
    await touchFamilyLastModified(familyId, timestamp)
  })
  requestAutoSync()
}

export async function deleteCategory(
  categoryId: number,
  familyId: number,
): Promise<void> {
  // Checked before the Dexie delete call because Dexie has no FK constraints
  // (docs/DB_SCHEMA.md section 3) — integrity must be enforced here, before
  // any row is removed, not discovered after the fact.
  const inUseCount = await countPlansUsingCategory(categoryId)
  if (inUseCount > 0) {
    throw new Error(
      `Cannot delete this category while ${inUseCount} spend plan${inUseCount === 1 ? '' : 's'} still reference${inUseCount === 1 ? 's' : ''} it.`,
    )
  }

  const timestamp = nowIso()
  await appDb.transaction('rw', appDb.categories, appDb.families, async () => {
    await appDb.categories.delete(categoryId)
    await touchFamilyLastModified(familyId, timestamp)
  })
  requestAutoSync()
}
