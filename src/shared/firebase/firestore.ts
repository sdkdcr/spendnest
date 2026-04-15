import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
  writeBatch,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
} from 'firebase/firestore'
import type {
  Family,
  MonthlySpendEntry,
  Person,
  SpendTemplate,
} from '../domain/types'
import { getFirebaseApp } from './firebaseApp'

const WRITE_BATCH_LIMIT = 400

interface CloudFamilyDoc {
  cloudFamilyId: string
  name: string
  memberEmails: string[]
  ownerUid: string
  createdAt: string
  updatedAt: string
}

export interface SharedFamilyBundle {
  family: Family
  persons: Person[]
  spendTemplates: SpendTemplate[]
  monthlySpendEntries: MonthlySpendEntry[]
}

function getDb() {
  return getFirestore(getFirebaseApp())
}

function normalizeEmail(email: string): string {
  return email.trim()
}

function getFamilyRef(cloudFamilyId: string): DocumentReference<DocumentData, DocumentData> {
  return doc(getDb(), 'families', cloudFamilyId)
}

function getFamilySubCollection(
  cloudFamilyId: string,
  collectionName: 'persons' | 'spendTemplates' | 'monthlySpendEntries',
): CollectionReference<DocumentData, DocumentData> {
  return collection(getDb(), 'families', cloudFamilyId, collectionName)
}

function getRecordId(record: { id?: number }): string | null {
  if (typeof record.id !== 'number') {
    return null
  }

  return String(record.id)
}

async function readFamilySubCollection<T>(
  cloudFamilyId: string,
  collectionName: 'persons' | 'spendTemplates' | 'monthlySpendEntries',
): Promise<T[]> {
  const snapshot = await getDocs(getFamilySubCollection(cloudFamilyId, collectionName))
  return snapshot.docs.map((snapshotDoc) => snapshotDoc.data() as T)
}

async function upsertSubCollection<T extends { id?: number }>(
  cloudFamilyId: string,
  collectionName: 'persons' | 'spendTemplates' | 'monthlySpendEntries',
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
      batch.set(entry.ref, entry.record, {
        merge: true,
      })
    }

    await batch.commit()
  }

  return writeTargets.length
}

export async function loadSharedFamilyData(
  email: string,
): Promise<SharedFamilyBundle[]> {
  const normalizedEmail = normalizeEmail(email)

  const familyQuery = query(
    collection(getDb(), 'families'),
    where('memberEmails', 'array-contains', normalizedEmail),
  )

  const familySnapshot = await getDocs(familyQuery)

  const bundles = await Promise.all(
    familySnapshot.docs.map(async (snapshotDoc) => {
      const cloudFamily = snapshotDoc.data() as CloudFamilyDoc
      const cloudFamilyId = snapshotDoc.id

      const [persons, spendTemplates, monthlySpendEntries] = await Promise.all([
        readFamilySubCollection<Person>(cloudFamilyId, 'persons'),
        readFamilySubCollection<SpendTemplate>(cloudFamilyId, 'spendTemplates'),
        readFamilySubCollection<MonthlySpendEntry>(cloudFamilyId, 'monthlySpendEntries'),
      ])

      const family: Family = {
        name: cloudFamily.name,
        cloudFamilyId,
        memberEmails: cloudFamily.memberEmails,
        createdAt: cloudFamily.createdAt,
        updatedAt: cloudFamily.updatedAt,
      }

      return {
        family,
        persons,
        spendTemplates,
        monthlySpendEntries,
      }
    }),
  )

  return bundles
}

export async function pushSharedFamilyData(
  uid: string,
  email: string,
  familyBundles: SharedFamilyBundle[],
): Promise<number> {
  const normalizedEmail = normalizeEmail(email)
  const db = getDb()
  let totalWrites = 0

  for (const bundle of familyBundles) {
    const cloudFamilyId = bundle.family.cloudFamilyId
    if (!cloudFamilyId) {
      continue
    }

    const familyRef = getFamilyRef(cloudFamilyId)
    const existingFamilySnapshot = await getDoc(familyRef)
    const existingFamily = existingFamilySnapshot.exists()
      ? (existingFamilySnapshot.data() as CloudFamilyDoc)
      : null

    const memberEmails = Array.from(
      new Set([
        normalizedEmail,
        ...(existingFamily?.memberEmails ?? []).map(normalizeEmail),
        ...(bundle.family.memberEmails ?? []).map(normalizeEmail),
      ]),
    )

    const familyDoc: CloudFamilyDoc = {
      cloudFamilyId,
      name: bundle.family.name,
      memberEmails,
      ownerUid: existingFamily?.ownerUid ?? uid,
      createdAt: existingFamily?.createdAt ?? bundle.family.createdAt,
      updatedAt: bundle.family.updatedAt,
    }

    await writeBatch(db)
      .set(familyRef, familyDoc, { merge: true })
      .commit()

    totalWrites += 1

    const [personCount, templateCount, monthlyCount] = await Promise.all([
      upsertSubCollection(cloudFamilyId, 'persons', bundle.persons),
      upsertSubCollection(cloudFamilyId, 'spendTemplates', bundle.spendTemplates),
      upsertSubCollection(cloudFamilyId, 'monthlySpendEntries', bundle.monthlySpendEntries),
    ])

    totalWrites += personCount + templateCount + monthlyCount
  }

  return totalWrites
}
