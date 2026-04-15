import {
  collection,
  doc,
  getDocs,
  getFirestore,
  writeBatch,
  type CollectionReference,
  type DocumentData,
} from 'firebase/firestore'
import type {
  Family,
  MonthlySpendEntry,
  Person,
  SpendTemplate,
} from '../domain/types'
import { getFirebaseApp } from './firebaseApp'

export interface UserCloudData {
  families: Family[]
  persons: Person[]
  spendTemplates: SpendTemplate[]
  monthlySpendEntries: MonthlySpendEntry[]
}

type UserCollectionName =
  | 'families'
  | 'persons'
  | 'spendTemplates'
  | 'monthlySpendEntries'
const WRITE_BATCH_LIMIT = 400

function getDb() {
  return getFirestore(getFirebaseApp())
}

function getUserCollection(
  uid: string,
  collectionName: UserCollectionName,
): CollectionReference<DocumentData, DocumentData> {
  return collection(getDb(), 'users', uid, collectionName)
}

async function readUserCollection<T>(
  uid: string,
  collectionName: UserCollectionName,
): Promise<T[]> {
  const snapshot = await getDocs(getUserCollection(uid, collectionName))
  return snapshot.docs.map((snapshotDoc) => snapshotDoc.data() as T)
}

function getRecordId(record: { id?: number }): string | null {
  if (typeof record.id !== 'number') {
    return null
  }

  return String(record.id)
}

async function upsertUserCollection<T extends { id?: number }>(
  uid: string,
  collectionName: UserCollectionName,
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
        ref: doc(db, 'users', uid, collectionName, recordId),
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
      batch.set(entry.ref, entry.record, {
        merge: true,
      })
    }

    await batch.commit()
  }

  return writeTargets.length
}

export async function loadUserCloudData(uid: string): Promise<UserCloudData> {
  const [families, persons, spendTemplates, monthlySpendEntries] = await Promise.all([
    readUserCollection<Family>(uid, 'families'),
    readUserCollection<Person>(uid, 'persons'),
    readUserCollection<SpendTemplate>(uid, 'spendTemplates'),
    readUserCollection<MonthlySpendEntry>(uid, 'monthlySpendEntries'),
  ])

  return {
    families,
    persons,
    spendTemplates,
    monthlySpendEntries,
  }
}

export async function pushUserCloudData(
  uid: string,
  data: UserCloudData,
): Promise<number> {
  const [familyCount, personCount, templateCount, monthlyEntryCount] = await Promise.all([
    upsertUserCollection(uid, 'families', data.families),
    upsertUserCollection(uid, 'persons', data.persons),
    upsertUserCollection(uid, 'spendTemplates', data.spendTemplates),
    upsertUserCollection(uid, 'monthlySpendEntries', data.monthlySpendEntries),
  ])

  return familyCount + personCount + templateCount + monthlyEntryCount
}
