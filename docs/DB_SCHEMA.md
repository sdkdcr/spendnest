# SpendNest DB Schema

## 1. Overview
SpendNest uses IndexedDB via Dexie.

- Database name: `spendnest-db`
- Schema version: `4` (adds `categories` as a referenced entity — supersedes free-text `SpendPlan.type`)
- Storage adapter: Dexie (`src/shared/db/appDb.ts`)

This is a normalized, three-table schema. There is deliberately **no** monthly-entry table: nothing is persisted per month. Every month's resolved amount (current, past, or projected) is computed live from a plan's `baseBudget` and `steps` via `resolveBudgetForMonth` (see `docs/REQUIREMENTS.md` section 4.3). This keeps indexed, per-record queries and per-record Firestore sync (last-write-wins) intact — collapsing further into a single JSON blob per family was considered and rejected, since it would force whole-family document rewrites on every edit and turn per-record conflict resolution into per-family conflict resolution. See "JSON Conversion" (section 6) for how records still interoperate with plain JSON for backup/restore.

## 2. Tables

### 2.1 `families`
Purpose: top-level grouping for all budget records.

Fields:
- `id` (`number`, PK, auto-increment)
- `name` (`string`, required)
- `memberEmails` (`string[]`, optional)
- `cloudFamilyId` (`string`, optional)
- `lastModifiedAt` (`string`, ISO timestamp, optional) — family-level sync watermark, bumped on every local write to `persons`/`spendPlans` scoped to this family. Mirrored on the Firestore family doc. Used only to decide whether to show the launch-time sync banner (`docs/REQUIREMENTS.md` section 4.7.1) — it does not replace per-record `updatedAt` merging. Unset means "no local changes recorded yet" (e.g. first launch on a new device).
- `createdAt` (`string`, ISO timestamp)
- `updatedAt` (`string`, ISO timestamp)

Dexie store:
```text
++id, name, cloudFamilyId, updatedAt
```

Indexes:
- PK: `id`
- Secondary: `name`, `cloudFamilyId`, `updatedAt`

### 2.2 `persons`
Purpose: person/member records under a family.

Fields:
- `id` (`number`, PK, auto-increment)
- `familyId` (`number`, FK -> `families.id`)
- `name` (`string`, required)
- `createdAt` (`string`, ISO timestamp)
- `updatedAt` (`string`, ISO timestamp)

Dexie store:
```text
++id, familyId, name, updatedAt
```

Indexes:
- PK: `id`
- Secondary: `familyId`, `name`, `updatedAt`

### 2.3 `categories`
Purpose: user-managed spend categories (e.g. Insurance, Transport, Utility), owned per family and editable in Settings. Referenced by `spendPlans.categoryId` — renaming a category here reflects everywhere a plan is displayed, since plans store a reference rather than a copy of the name.

Fields:
- `id` (`number`, PK, auto-increment)
- `familyId` (`number`, FK -> `families.id`)
- `name` (`string`, required)
- `color` (`string`, required, hex value) — assigned once at creation from the fixed palette (`docs/REQUIREMENTS.md` section 4.5), and stays fixed regardless of what other categories are added, renamed, or deleted. Replaces the previous behavior of deriving color from a category's alphabetical position among currently-in-use types, which reshuffled every category's color whenever the distinct-type set changed.
- `isRetirementCorpus` (`boolean`, optional, defaults to `false`) — tags this category as contributing to the Retirement Corpus projection (`docs/REQUIREMENTS.md` section 4.9). Purely a flag; unrelated to any spend-plan field.
- `retirementCurrentBalance` (`number`, optional) — user-entered current accumulated balance for this category, as of today. Only meaningful when `isRetirementCorpus` is `true`; ignored otherwise.
- `retirementAnnualGrowthRatePercent` (`number`, optional) — user-entered assumed annual growth rate (e.g. `8` for 8%) applied when projecting this category's contribution to future years. Only meaningful when `isRetirementCorpus` is `true`.
- `createdAt` (`string`, ISO timestamp)
- `updatedAt` (`string`, ISO timestamp)

None of the three retirement fields are part of the Dexie index string — they're plain fields read as part of the whole `categories` row, same as `color`. No schema version bump is required to add them (additive optional fields on an existing, non-indexed part of the record).

Dexie store:
```text
++id, familyId, name, updatedAt
```

Indexes:
- PK: `id`
- Secondary: `familyId`, `name`, `updatedAt`

A category cannot be deleted while any `spendPlans` row references it (enforced in application code, not at the Dexie level — see 3).

### 2.4 `spendPlans`
Purpose: reusable spend definitions (monthly/quarterly/annual/ad-hoc), each owning its own amount history via an embedded `steps` array. Replaces `spendTemplates`; absorbs everything `monthlySpendEntries` used to carry except status/usage (dropped — see `docs/REQUIREMENTS.md` section 4.4).

Fields:
- `id` (`number`, PK, auto-increment)
- `familyId` (`number`, FK -> `families.id`)
- `personId` (`number`, optional FK -> `persons.id`)
- `categoryId` (`number`, FK -> `categories.id`) — replaces the free-text `type` field. Display name and color are always looked up live from the referenced `categories` row, never copied onto the plan.
- `name` (`string`, required)
- `frequency` (`'Monthly' | 'Quarterly' | 'Annually' | 'AdHoc'`)
- `baseBudget` (`number`, required) — starting amount before any steps apply.
- `startMonth` (`string`, format `YYYY-MM`) — cycle anchor for frequency eligibility.
- `endDate` (`string`, format `YYYY-MM`, optional) — last eligible month; generic replacement for the old EMI-only `emiEndMonth`.
- `dayOfDeduction` (`number`, optional, 1-31) — informational/display only (e.g. "due on the 5th"); generic replacement for `deductionDayOfMonth`. Drives no status change, since no status is persisted.
- `quantity` (`string`, required, free text)
- `steps` (`StepChange[]`, required, defaults to `[]`) — embedded JSON array, **not** a separate table. See 2.4.1.
- `createdAt` (`string`, ISO timestamp)
- `updatedAt` (`string`, ISO timestamp)

Dexie store:
```text
++id, familyId, personId, frequency, categoryId, updatedAt
```

Indexes:
- PK: `id`
- Secondary: `familyId`, `personId`, `frequency`, `categoryId`, `updatedAt`
- `steps` is intentionally **not** indexed — it's read as a whole array per plan and resolved in application code (`resolveBudgetForMonth`), never queried by Dexie directly.

#### 2.4.1 `StepChange` (embedded, not a table)
```ts
type StepChange = {
  effectiveDate: string  // YYYY-MM or YYYY-MM-DD
  amount: number
  oneOff?: boolean        // true = applies only to the cycle containing effectiveDate, then reverts
}
```
Stored as a plain JSON array on the `steps` field of each `spendPlans` row — Dexie persists it natively (structured-clone algorithm), no manual serialization needed inside the app. Serialization only becomes explicit at the JSON import/export boundary (section 6).

## 3. Relationships
- One `family` to many `persons`
- One `family` to many `categories`
- One `family` to many `spendPlans`
- One `category` to many `spendPlans`, via `spendPlans.categoryId`
- `personId` is optional on `spendPlans`
- `steps` is embedded 1:1 inside its owning `spendPlans` row (not a relationship to another table)

Note: IndexedDB/Dexie does not enforce FK constraints at the DB engine level. Integrity — including blocking deletion of a `categories` row referenced by any `spendPlans` row — is enforced in application logic (`src/features/settings/category.repository.ts`).

## 4. Enums
- `SpendFrequency`: `Monthly`, `Quarterly`, `Annually`, `AdHoc`

There is no `MonthlySpendStatus` enum — status tracking was removed along with the `monthlySpendEntries` table.

## 5. Migration Notes
When schema changes are needed:
1. Bump Dexie version in `src/shared/db/appDb.ts`.
2. Add `version(n).stores(...)` migration updates.
3. Backfill or transform existing records if shape changes.
4. Update this document and `docs/REQUIREMENTS.md` in the same PR.

### Migrating from the previous (`spendTemplates` + `monthlySpendEntries`) schema
A one-time Dexie `upgrade()` transform, run as part of the version bump to `3`:
1. For each `spendTemplates` row, create one `spendPlans` row: `cost` -> `baseBudget`; `emiEndMonth` -> `endDate`; `deductionDayOfMonth` -> `dayOfDeduction`; `createdAt`/`startMonth` unchanged; `steps` initialized from that plan's historical `monthlySpendEntries`, sorted by `monthKey`, emitting a `StepChange` (non-`oneOff`) wherever `cost` changed from the prior month's entry.
2. Drop the `monthlySpendEntries` table entirely (`status`, `usage`, `manuallyUpdatedStatus` are not carried forward — they have no place in the new model).
3. Drop the `spendTemplates` table once `spendPlans` is populated.

### Migrating free-text `type` to referenced `categories` (v3 -> v4)
A one-time Dexie `upgrade()` transform, run as part of the version bump to `4`:
1. For each distinct (`familyId`, `type`) pair found across existing `spendPlans` rows, create one `categories` row: `name` = the original `type` string, `color` = the next unused palette slot for that family (same fixed palette previously used by `buildCategoryColorMap`, assigned once and stored instead of derived at render time).
2. Rewrite every `spendPlans` row: drop `type`, add `categoryId` pointing at the `categories` row created for its (`familyId`, `type`) pair in step 1.
3. Update the `spendPlans` Dexie index string: `type` -> `categoryId` (2.4).

## 6. JSON Conversion (Import / Export)
Every table already round-trips to and from plain JSON for backup/restore — this isn't new machinery, just the existing per-table export/import pattern (`src/features/settings/backup.schema.ts`, `backup.service.ts`) retargeted at the current schema:

- **Table -> JSON (export)**: each of `families`, `persons`, `categories`, `spendPlans` is read in full (`toArray()`) and placed under `data.<tableName>` in the backup payload. `steps` needs no special handling — it's already a plain JSON-serializable array on each `spendPlans` record.
- **JSON -> Table (import)**: each array under `data.<tableName>` is validated against a per-table Zod schema (`spendPlanSchema` includes a nested `stepChangeSchema` array) and written back via `bulkPut`, mirroring today's `restoreBackup` flow. Older backups (`backupVersion: 2`, free-text `type`) are routed through the same v3->v4 transform logic in this section before import.

```json
{
  "backupVersion": 3,
  "exportedAt": "2026-08-01T00:00:00.000Z",
  "data": {
    "families": [{ "id": 1, "name": "Doe Family", "createdAt": "...", "updatedAt": "..." }],
    "persons": [{ "id": 1, "familyId": 1, "name": "Jane", "createdAt": "...", "updatedAt": "..." }],
    "categories": [
      { "id": 1, "familyId": 1, "name": "Utility", "color": "#4E79A7", "createdAt": "...", "updatedAt": "..." },
      {
        "id": 2,
        "familyId": 1,
        "name": "Investments",
        "color": "#59A14F",
        "isRetirementCorpus": true,
        "retirementCurrentBalance": 1500000,
        "retirementAnnualGrowthRatePercent": 10,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "spendPlans": [
      {
        "id": 1,
        "familyId": 1,
        "personId": 1,
        "categoryId": 1,
        "name": "Electricity",
        "frequency": "Monthly",
        "baseBudget": 2000,
        "startMonth": "2025-01",
        "dayOfDeduction": 5,
        "quantity": "",
        "steps": [
          { "effectiveDate": "2026-06", "amount": 3500, "oneOff": true }
        ],
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

This same JSON shape is also what Firestore sync pushes/pulls per record (`src/shared/sync/*.ts`), so the conversion logic is shared: one JSON-serializable representation per table row, used identically for cloud sync and for manual backup files. Bump `backupVersion` to `3` alongside the schema migration so older backup files (`type`-based shape) can be detected and routed through the migration transform in section 5 before import.
