import { z } from 'zod'

const timestampSchema = z.string().min(1)

const familySchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1),
  memberEmails: z.array(z.string().email()).optional(),
  cloudFamilyId: z.string().min(1).optional(),
  lastModifiedAt: timestampSchema.optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

const personSchema = z.object({
  id: z.number().int().positive().optional(),
  familyId: z.number().int().positive(),
  name: z.string().min(1),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

const categorySchema = z.object({
  id: z.number().int().positive().optional(),
  familyId: z.number().int().positive(),
  name: z.string().min(1),
  color: z.string().min(1),
  isRetirementCorpus: z.boolean().optional(),
  retirementCurrentBalance: z.number().optional(),
  retirementAnnualGrowthRatePercent: z.number().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

const stepChangeSchema = z.object({
  effectiveDate: z.string().min(1),
  amount: z.number(),
  oneOff: z.boolean().optional(),
})

const spendPlanSchema = z.object({
  id: z.number().int().positive().optional(),
  familyId: z.number().int().positive(),
  personId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive(),
  name: z.string().min(1),
  frequency: z.enum(['Monthly', 'Quarterly', 'Annually', 'AdHoc']),
  baseBudget: z.number(),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  dayOfDeduction: z.number().int().min(1).max(31).optional(),
  quantity: z.string().min(1),
  steps: z.array(stepChangeSchema),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const backupPayloadSchema = z.object({
  backupVersion: z.literal(3),
  exportedAt: timestampSchema,
  data: z.object({
    families: z.array(familySchema),
    persons: z.array(personSchema),
    categories: z.array(categorySchema),
    spendPlans: z.array(spendPlanSchema),
  }),
})

export type BackupPayload = z.infer<typeof backupPayloadSchema>

const legacyV2SpendPlanSchema = z.object({
  id: z.number().int().positive().optional(),
  familyId: z.number().int().positive(),
  personId: z.number().int().positive().optional(),
  type: z.string().min(1),
  name: z.string().min(1),
  frequency: z.enum(['Monthly', 'Quarterly', 'Annually', 'AdHoc']),
  baseBudget: z.number(),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  dayOfDeduction: z.number().int().min(1).max(31).optional(),
  quantity: z.string().min(1),
  steps: z.array(stepChangeSchema),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const legacyV2BackupPayloadSchema = z.object({
  backupVersion: z.literal(2),
  exportedAt: timestampSchema,
  data: z.object({
    families: z.array(familySchema),
    persons: z.array(personSchema),
    spendPlans: z.array(legacyV2SpendPlanSchema),
  }),
})

export type LegacyV2BackupPayload = z.infer<typeof legacyV2BackupPayloadSchema>

const legacySpendTemplateSchema = z.object({
  id: z.number().int().positive().optional(),
  familyId: z.number().int().positive(),
  personId: z.number().int().positive().optional(),
  type: z.string().min(1),
  name: z.string().min(1),
  frequency: z.enum(['Monthly', 'Quarterly', 'Annually', 'AdHoc']),
  cost: z.number(),
  quantity: z.string().min(1),
  emiAmount: z.number().optional(),
  deductionDayOfMonth: z.number().int().min(1).max(31).optional(),
  emiEndMonth: z.string().optional(),
  startMonth: z.string().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

const legacyMonthlySpendEntrySchema = z.object({
  id: z.number().int().positive().optional(),
  familyId: z.number().int().positive(),
  templateId: z.number().int().positive(),
  personId: z.number().int().positive().optional(),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
  type: z.string().min(1),
  name: z.string().min(1),
  cost: z.number(),
  quantity: z.string().min(1),
  status: z.enum(['Spent', 'Not Yet', 'Skip']),
  usage: z.number(),
  manuallyUpdatedStatus: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const legacyV1BackupPayloadSchema = z.object({
  backupVersion: z.literal(1),
  exportedAt: timestampSchema,
  data: z.object({
    families: z.array(familySchema),
    persons: z.array(personSchema),
    spendTemplates: z.array(legacySpendTemplateSchema),
    monthlySpendEntries: z.array(legacyMonthlySpendEntrySchema),
  }),
})

export type LegacyV1BackupPayload = z.infer<typeof legacyV1BackupPayloadSchema>
