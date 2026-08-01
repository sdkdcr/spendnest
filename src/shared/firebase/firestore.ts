import {
  collection,
  doc,
  getDocs,
  getFirestore,
  writeBatch,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
} from 'firebase/firestore'
import { getFirebaseApp } from './firebaseApp'

export const WRITE_BATCH_LIMIT = 400

export type FamilySubCollectionName = 'persons' | 'spendPlans'

export interface CloudFamilyDoc {
  cloudFamilyId: string
  name: string
  memberEmails: string[]
  ownerUid: string
  lastModifiedAt?: string
  createdAt: string
  updatedAt: string
}

export function getDb() {
  return getFirestore(getFirebaseApp())
}

export function normalizeEmail(email: string): string {
  return email.trim()
}

export function getFamilyRef(cloudFamilyId: string): DocumentReference<DocumentData, DocumentData> {
  return doc(getDb(), 'families', cloudFamilyId)
}

export function getFamilySubCollection(
  cloudFamilyId: string,
  collectionName: FamilySubCollectionName,
): CollectionReference<DocumentData, DocumentData> {
  return collection(getDb(), 'families', cloudFamilyId, collectionName)
}

export function getRecordId(record: { id?: number }): string | null {
  if (typeof record.id !== 'number') {
    return null
  }

  return String(record.id)
}

export function omitUndefined(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, v]) => v !== undefined))
}

export async function readFamilySubCollection<T>(
  cloudFamilyId: string,
  collectionName: FamilySubCollectionName,
): Promise<T[]> {
  const snapshot = await getDocs(getFamilySubCollection(cloudFamilyId, collectionName))
  return snapshot.docs.map((snapshotDoc) => snapshotDoc.data() as T)
}

export async function upsertSubCollection<T extends { id?: number }>(
  cloudFamilyId: string,
  collectionName: FamilySubCollectionName,
  records: T[],
): Promise<number> {
  const db = getDb()
  const writeTargets = records
    .map((record) => {
      const recordId = getRecordId(record)
      if (!recordId) {
        return null
      }

      return {
        ref: doc(db, 'families', cloudFamilyId, collectionName, recordId),
        record,
      }
    })
    .filter((entry) => entry !== null)

  if (writeTargets.length === 0) {
    return 0
  }

  for (let index = 0; index < writeTargets.length; index += WRITE_BATCH_LIMIT) {
    const batch = writeBatch(db)
    const chunk = writeTargets.slice(index, index + WRITE_BATCH_LIMIT)

    for (const entry of chunk) {
      batch.set(entry.ref, omitUndefined(entry.record as Record<string, unknown>), {
        merge: true,
      })
    }

    await batch.commit()
  }

  return writeTargets.length
}

export async function deleteSubCollectionOrphans(
  cloudFamilyId: string,
  collectionName: FamilySubCollectionName,
  keepIds: Set<string>,
): Promise<number> {
  const snapshot = await getDocs(getFamilySubCollection(cloudFamilyId, collectionName))
  const toDelete = snapshot.docs.filter((d) => !keepIds.has(d.id))

  if (toDelete.length === 0) {
    return 0
  }

  const db = getDb()
  for (let i = 0; i < toDelete.length; i += WRITE_BATCH_LIMIT) {
    const batch = writeBatch(db)
    const chunk = toDelete.slice(i, i + WRITE_BATCH_LIMIT)
    for (const d of chunk) {
      batch.delete(d.ref)
    }
    await batch.commit()
  }

  return toDelete.length
}

export async function deleteCloudFamilyDoc(cloudFamilyId: string): Promise<void> {
  const db = getDb()
  await writeBatch(db).delete(getFamilyRef(cloudFamilyId)).commit()
}
