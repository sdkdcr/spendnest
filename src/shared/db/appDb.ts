import Dexie, { type Table } from 'dexie'
import { generateClientId } from '../domain/id'
import type { Category, Family, Person, SpendPlan } from '../domain/types'
import { migrateSpendPlanTypesToCategories } from './category-migration'
import {
  migrateLegacySpendTemplates,
  type LegacyMonthlySpendEntry,
  type LegacySpendPlanWithType,
  type LegacySpendTemplate,
} from './legacy-migration'

class SpendNestDb extends Dexie {
  families!: Table<Family, number>
  persons!: Table<Person, number>
  categories!: Table<Category, number>
  spendPlans!: Table<SpendPlan, number>

  public constructor() {
    super('spendnest-db')

    this.version(1).stores({
      families: '++id, name, updatedAt',
      persons: '++id, familyId, name, updatedAt',
      spendTemplates: '++id, familyId, personId, frequency, type, updatedAt',
      monthlySpendEntries:
        '++id, familyId, templateId, personId, monthKey, status, type, updatedAt',
    })

    this.version(2).stores({
      families: '++id, name, cloudFamilyId, updatedAt',
      persons: '++id, familyId, name, updatedAt',
      spendTemplates: '++id, familyId, personId, frequency, type, updatedAt',
      monthlySpendEntries:
        '++id, familyId, templateId, personId, monthKey, status, type, updatedAt',
    })

    this.version(3)
      .stores({
        families: '++id, name, cloudFamilyId, updatedAt',
        persons: '++id, familyId, name, updatedAt',
        spendTemplates: null,
        monthlySpendEntries: null,
        spendPlans: '++id, familyId, personId, frequency, type, updatedAt',
      })
      .upgrade(async (transaction) => {
        const templates = (await transaction
          .table('spendTemplates')
          .toArray()) as LegacySpendTemplate[]
        const entries = (await transaction
          .table('monthlySpendEntries')
          .toArray()) as LegacyMonthlySpendEntry[]

        const plans = migrateLegacySpendTemplates(templates, entries)

        if (plans.length > 0) {
          await transaction.table('spendPlans').bulkAdd(plans)
        }
      })

    this.version(4)
      .stores({
        families: '++id, name, cloudFamilyId, updatedAt',
        persons: '++id, familyId, name, updatedAt',
        categories: '++id, familyId, name, updatedAt',
        spendPlans: '++id, familyId, personId, frequency, categoryId, updatedAt',
      })
      .upgrade(async (transaction) => {
        const legacyPlans = (await transaction
          .table('spendPlans')
          .toArray()) as LegacySpendPlanWithType[]

        const { categories, spendPlans } = migrateSpendPlanTypesToCategories(
          legacyPlans,
          generateClientId,
          new Date().toISOString(),
        )

        if (categories.length > 0) {
          await transaction.table('categories').bulkAdd(categories)
        }

        for (const plan of spendPlans) {
          await transaction.table('spendPlans').put(plan)
        }
      })
  }
}

export const appDb = new SpendNestDb()
