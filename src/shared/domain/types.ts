export type SpendFrequency = 'Monthly' | 'Quarterly' | 'Annually' | 'AdHoc'

export interface Family {
  id?: number
  name: string
  memberEmails?: string[]
  cloudFamilyId?: string
  lastModifiedAt?: string
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

export interface StepChange {
  effectiveDate: string
  amount: number
  oneOff?: boolean
}

export interface SpendPlan {
  id?: number
  familyId: number
  personId?: number
  type: string
  name: string
  frequency: SpendFrequency
  baseBudget: number
  startMonth: string
  endDate?: string
  dayOfDeduction?: number
  quantity: string
  steps: StepChange[]
  createdAt: string
  updatedAt: string
}
