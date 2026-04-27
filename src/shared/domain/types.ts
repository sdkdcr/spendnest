export type SpendFrequency = 'Monthly' | 'Quarterly' | 'Annually' | 'AdHoc'

export type MonthlySpendStatus = 'Spent' | 'Not Yet' | 'Skip'

export interface Family {
  id?: number
  name: string
  memberEmails?: string[]
  cloudFamilyId?: string
  createdAt: string
  updatedAt: string
}

export interface Person {
  id?: number
  familyId: number
  name: string
  createdAt: string
  updatedAt: string
}

export interface SpendTemplate {
  id?: number
  familyId: number
  personId?: number
  type: string
  name: string
  frequency: SpendFrequency
  cost: number
  quantity: string
  emiAmount?: number
  deductionDayOfMonth?: number
  emiEndMonth?: string
  startMonth?: string
  createdAt: string
  updatedAt: string
}

export interface MonthlySpendEntry {
  id?: number
  familyId: number
  templateId: number
  personId?: number
  monthKey: string
  type: string
  name: string
  cost: number
  quantity: string
  status: MonthlySpendStatus
  usage: number
  manuallyUpdatedStatus: boolean
  createdAt: string
  updatedAt: string
}
