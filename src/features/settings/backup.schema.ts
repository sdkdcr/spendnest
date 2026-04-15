import { z } from 'zod'

const timestampSchema = z.string().min(1)

const familySchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1),
  memberEmails: z.array(z.string().email()).optional(),
  cloudFamilyId: z.string().min(1).optional(),
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

const spendTemplateSchema = z.object({
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
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

const monthlySpendEntrySchema = z.object({
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

export const backupPayloadSchema = z.object({
  backupVersion: z.literal(1),
  exportedAt: timestampSchema,
  data: z.object({
    families: z.array(familySchema),
    persons: z.array(personSchema),
    spendTemplates: z.array(spendTemplateSchema),
    monthlySpendEntries: z.array(monthlySpendEntrySchema),
  }),
})

export type BackupPayload = z.infer<typeof backupPayloadSchema>
