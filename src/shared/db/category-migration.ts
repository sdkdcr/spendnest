import { CATEGORY_COLOR_PALETTE } from '../domain/category-palette'
import type { Category, SpendPlan } from '../domain/types'
import type { LegacySpendPlanWithType } from './legacy-migration'

export interface CategoryMigrationResult {
  categories: Category[]
  spendPlans: SpendPlan[]
}

// Migrates free-text spendPlans.type into referenced categories rows, per
// docs/DB_SCHEMA.md section 5 (v3 -> v4). Shared by the Dexie upgrade and by
// backup import of older (backupVersion 1/2) files so both paths stay
// identical. One categories row is created per distinct (familyId, type)
// pair; colors are assigned once here and never re-derived.
export function migrateSpendPlanTypesToCategories(
  legacyPlans: LegacySpendPlanWithType[],
  nextCategoryId: () => number,
  timestamp: string,
): CategoryMigrationResult {
  const categories: Category[] = []
  const categoryIdByFamilyAndType = new Map<string, number>()

  function resolveCategoryId(familyId: number, type: string): number {
    const key = `${familyId}::${type}`
    const existingId = categoryIdByFamilyAndType.get(key)
    if (existingId !== undefined) {
      return existingId
    }

    const categoriesForFamily = categories.filter((category) => category.familyId === familyId)
    const usedColors = new Set(categoriesForFamily.map((category) => category.color))
    const nextColor =
      CATEGORY_COLOR_PALETTE.find((color) => !usedColors.has(color)) ??
      CATEGORY_COLOR_PALETTE[categoriesForFamily.length % CATEGORY_COLOR_PALETTE.length]

    const id = nextCategoryId()
    categories.push({
      id,
      familyId,
      name: type,
      color: nextColor,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    categoryIdByFamilyAndType.set(key, id)
    return id
  }

  const spendPlans: SpendPlan[] = legacyPlans.map((legacyPlan) => {
    const { type, ...rest } = legacyPlan
    return {
      ...rest,
      categoryId: resolveCategoryId(legacyPlan.familyId, type),
    }
  })

  return { categories, spendPlans }
}
