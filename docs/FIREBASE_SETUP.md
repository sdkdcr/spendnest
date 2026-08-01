# Firebase Setup (Google Auth + Firestore)

This guide enables multi-device sync for SpendNest while preserving local-first behavior.

## 1. Target Architecture

- App host: Cloudflare Pages
- Local cache/offline: IndexedDB (Dexie)
- Identity: Firebase Authentication (Google provider)
- Cloud sync store: Cloud Firestore

Flow:

1. User signs in with Google.
2. App loads cloud data for that user into IndexedDB.
3. User edits write to IndexedDB first.
4. Background sync pushes changes to Firestore.
5. Other devices pull updates on sign-in/open.

## 2. Create Firebase Project

1. Open Firebase Console and create project: `spendnest` (or environment-specific name).
2. Enable Google Analytics only if needed (optional for MVP).
3. Add a Web App in Firebase project settings.
4. Copy the Firebase web config values.

Note the **project ID** shown under Project Settings (e.g. `spendnest-134b6`) —
Firebase appends a random suffix if the plain display name is already taken.
The CLI's `--project` flag and `.firebaserc` need this ID, not the display
name; using the display name where the ID is expected fails with a
permissions/403 error even for an account that genuinely has access.

## 3. Enable Authentication (Google)

1. Go to `Authentication -> Sign-in method`.
2. Enable `Google` provider.
3. Set support email.
4. Add authorized domains:
   - local: `localhost`
   - prod: `<your-pages-domain>.pages.dev`
   - custom domain if used.

## 4. Enable Firestore

1. Go to `Firestore Database -> Create database`.
2. Start in `Production mode`.
3. Choose closest region to primary users.
4. Keep default database ID.

## 5. Environment Variables (Vite + Cloudflare Pages)

Create `.env.local` for local development:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Cloudflare Pages:

1. Open `Workers & Pages -> <project> -> Settings -> Variables and Secrets`.
2. Add the same `VITE_FIREBASE_*` variables for `Production` and `Preview`.
3. Redeploy after adding variables.

Notes:

- Firebase web config values are client-visible by design.
- Never commit `.env.local`.

## 6. Data Model (Firestore)

The implemented model uses a **shared-family** structure, not per-user isolation.
Access is granted to any signed-in user whose email appears in the family's `memberEmails` array.

Collections:

```
families/{cloudFamilyId}                         ← family document
families/{cloudFamilyId}/persons/{personId}
families/{cloudFamilyId}/categories/{categoryId}
families/{cloudFamilyId}/spendPlans/{planId}
```

Note: this replaces the original `spendTemplates`/`monthlySpendEntries` subcollections from the pre-`SpendPlan` schema (see `docs/DB_SCHEMA.md` sections 2.3/2.4/5). **Any previously deployed security rules must be updated to match** — rules granting access only to the old subcollection names will silently reject writes to `categories`/`spendPlans` with "Missing or insufficient permissions," since Firestore denies by default on any path a rule doesn't explicitly allow.

`cloudFamilyId` format: `family_{ownerUid}_{localFamilyId}` — generated on first push, stored locally in IndexedDB.

Family document fields (in addition to domain fields):

- `cloudFamilyId` (string) — mirrors the document ID
- `ownerUid` (string) — Firebase UID of the user who first created the family in the cloud
- `memberEmails` (string[]) — all emails that may access this family; merged on every push
- `updatedAt` (ISO string) — used for last-write-wins conflict resolution

Subcollection document fields:

- All existing domain fields (id, familyId, etc.)
- `updatedAt` (ISO string) — conflict resolution key

ID strategy:

- Subcollection documents use the local numeric `id` (as a string) as the Firestore document ID.
- This keeps IDs stable across devices and enables simple upsert semantics.

## 7. Security Rules (Shared Family by Email)

For shared families, authorize access when the signed-in email is present in the
family document's `memberEmails` array.

Rules are checked into the repo at `firestore.rules` (source of truth — do not
edit rules ad hoc in the Firebase Console without also updating this file, or
the two will drift the way the old `spendTemplates`/`monthlySpendEntries`-only
rules silently drifted from the app's later `categories`/`spendPlans` schema).
`firebase.json` points the Firebase CLI at it; `.firebaserc` pins the default
project to `spendnest-134b6` (the project's actual ID — note this differs from
the display name `spendnest` used elsewhere in this doc; using the display name
in place of the ID with `--project` will fail with a permissions/403 error even
for an account that has real access to the project).

Deploy after any change to `firestore.rules`:

```bash
npm install -g firebase-tools   # one-time, if not already installed
firebase login                  # one-time, or firebase login:ci for a token usable from a non-interactive shell
firebase deploy --only firestore:rules
# .firebaserc supplies the project, so --project is no longer required day-to-day;
# only pass it explicitly (with the project ID, not the display name) to target a
# different project, e.g.:
#   firebase deploy --only firestore:rules --project spendnest-134b6 --token "$PERSONAL_FIREBASE_TOKEN"
```

Current rules (`firestore.rules`):

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null && request.auth.token.email != null;
    }

    function isFamilyMemberDoc(familyId) {
      let family = get(/databases/$(database)/documents/families/$(familyId));
      return family != null
        && family.data.memberEmails is list
        && request.auth.token.email in family.data.memberEmails;
    }

    match /families/{familyId} {
      allow get: if isSignedIn()
        && (resource == null
          || (resource.data.memberEmails is list
            && request.auth.token.email in resource.data.memberEmails));

      allow list: if isSignedIn();

      allow create: if isSignedIn()
        && request.resource.data.memberEmails is list
        && request.auth.token.email in request.resource.data.memberEmails;

      allow update, delete: if isSignedIn()
        && resource.data.memberEmails is list
        && request.auth.token.email in resource.data.memberEmails;

      match /persons/{personId} {
        allow read, write: if isSignedIn() && isFamilyMemberDoc(familyId);
      }
      match /categories/{categoryId} {
        allow read, write: if isSignedIn() && isFamilyMemberDoc(familyId);
      }
      match /spendPlans/{planId} {
        allow read, write: if isSignedIn() && isFamilyMemberDoc(familyId);
      }
    }
  }
}

```

Notes:

- Save emails in `memberEmails` in the same casing as auth provider returns (or consistently lowercase in both app + rules).
- Owner should also be included in `memberEmails`.
- These rules must be kept in sync with `FamilySubCollectionName` in `src/shared/firebase/firestore.ts` — whenever a subcollection is renamed or added there (as happened when `spendTemplates`/`monthlySpendEntries` became `spendPlans`, and when `categories` was introduced), `firestore.rules` needs the matching update, deployed via the command above, or writes to the new/renamed path will fail with "Missing or insufficient permissions" even though the app code is otherwise correct.
- If you have already deployed the old rules from the Firebase Console UI, running the deploy command above will overwrite them with this file's contents — that's the fix for the current permissions error, since the console version only allows `spendTemplates`/`monthlySpendEntries`.

## 8. Sync Strategy (MVP)

- Conflict policy: last-write-wins using `updatedAt`.
- Write path:
  1. Persist to IndexedDB immediately.
  2. Queue cloud sync task.
  3. Upsert to Firestore.
- Read path:
  1. On auth success, fetch Firestore snapshot.
  2. Merge into IndexedDB by ID + `updatedAt`.
  3. Render from IndexedDB.
- Retry:
  - On sync failure, mark pending state and retry on reconnect/app resume.

## 9. Implementation Checklist (Code)

- Install Firebase SDK:
  - `npm install firebase`
- Add modules:
  - `src/shared/firebase/firebaseApp.ts`
  - `src/shared/firebase/auth.ts`
  - `src/shared/firebase/firestore.ts`
  - `src/shared/sync/sync.service.ts`
- Add auth state to store:
  - uid, email, displayName, authReady, signIn, signOut
- Trigger initial cloud pull after login.
- Trigger background push on local mutations.
- Add settings UI:
  - `Sign in with Google`
  - `Sign out`
  - `Last sync status`
  - `Sync now` action

## 10. Operational Guidance

- Expected usage (20-30 internal users) should typically remain within Firebase free quotas for normal traffic.
- Monitor:
  - Firebase Console -> Authentication usage
  - Firebase Console -> Firestore usage
- Add budget alerts in Google Cloud billing before scaling beyond internal usage.

## 11. Go-Live Validation

1. User can sign in/out on local and production.
2. Data created on Device A appears on Device B after login and sync.
3. Offline edits persist locally and sync once online.
4. No unauthorized user can read/write another user's docs.
5. Existing JSON backup export/import still works.
