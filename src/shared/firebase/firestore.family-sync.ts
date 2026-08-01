import { collection, getDoc, getDocs, query, where, writeBatch } from 'firebase/firestore'
import type { Family, Person, SpendPlan } from '../domain/types'
import {
  getDb,
  getFamilyRef,
  normalizeEmail,
  readFamilySubCollection,
  upsertSubCollection,
  type CloudFamilyDoc,
} from './firestore'

export interface SharedFamilyBundle {
  family: Family
  persons: Person[]
  spendPlans: SpendPlan[]
}

export async function getCloudFamilyDoc(
  cloudFamilyId: string,
): Promise<CloudFamilyDoc | null> {
  const snapshot = await getDoc(getFamilyRef(cloudFamilyId))
  return snapshot.exists() ? (snapshot.data() as CloudFamilyDoc) : null
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

      const [persons, spendPlans] = await Promise.all([
        readFamilySubCollection<Person>(cloudFamilyId, 'persons'),
        readFamilySubCollection<SpendPlan>(cloudFamilyId, 'spendPlans'),
      ])

      const family: Family = {
        name: cloudFamily.name,
        cloudFamilyId,
        memberEmails: cloudFamily.memberEmails,
        lastModifiedAt: cloudFamily.lastModifiedAt,
        createdAt: cloudFamily.createdAt,
        updatedAt: cloudFamily.updatedAt,
      }

      return { family, persons, spendPlans }
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
    const existingFamily = await getCloudFamilyDoc(cloudFamilyId)

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
      lastModifiedAt: bundle.family.lastModifiedAt,
      createdAt: existingFamily?.createdAt ?? bundle.family.createdAt,
      updatedAt: bundle.family.updatedAt,
    }

    await writeBatch(db)
      .set(familyRef, familyDoc, { merge: true })
      .commit()

    totalWrites += 1

    const [personCount, planCount] = await Promise.all([
      upsertSubCollection(cloudFamilyId, 'persons', bundle.persons),
      upsertSubCollection(cloudFamilyId, 'spendPlans', bundle.spendPlans),
    ])

    totalWrites += personCount + planCount
  }

  return totalWrites
}
