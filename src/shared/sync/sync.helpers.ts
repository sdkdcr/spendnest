export interface TimestampedEntity {
  id?: number
  updatedAt: string
}

export interface PullSummary {
  pulled: number
}

export interface PushSummary {
  pushed: number
}

export function parseTimestamp(value: string): number {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export function normalizeEmail(email: string): string {
  return email.trim()
}

export function buildCloudFamilyId(uid: string, familyId: number): string {
  return `family_${uid}_${familyId}`
}
