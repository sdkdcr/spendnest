import Dexie, { type Table } from 'dexie'
import type {
  Family,
  MonthlySpendEntry,
  Person,
  SpendTemplate,
} from '../domain/types'

class SpendNestDb extends Dexie {
  families!: Table<Family, number>
  persons!: Table<Person, number>
  spendTemplates!: Table<SpendTemplate, number>
  monthlySpendEntries!: Table<MonthlySpendEntry, number>

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
  }
}

export const appDb = new SpendNestDb()
