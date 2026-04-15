# SpendNest DB Schema

## 1. Overview
SpendNest uses IndexedDB via Dexie.

- Database name: `spendnest-db`
- Current schema version: `1`
- Storage adapter: Dexie (`src/shared/db/appDb.ts`)

## 2. Tables

### 2.1 `families`
Purpose: top-level grouping for all budget records.

Fields:
- `id` (`number`, PK, auto-increment)
- `name` (`string`, required)
- `createdAt` (`string`, ISO timestamp)
- `updatedAt` (`string`, ISO timestamp)

Dexie store:
```text
++id, name, updatedAt
```

Indexes:
- PK: `id`
- Secondary: `name`, `updatedAt`

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

### 2.3 `spendTemplates`
Purpose: reusable spend definitions (monthly/quarterly/annual/ad-hoc).

Fields:
- `id` (`number`, PK, auto-increment)
- `familyId` (`number`, FK -> `families.id`)
- `personId` (`number`, optional FK -> `persons.id`)
- `type` (`string`, required)
- `name` (`string`, required)
- `frequency` (`'Monthly' | 'Quarterly' | 'Annually' | 'AdHoc'`)
- `cost` (`number`, required)
- `quantity` (`string`, required)
- `emiAmount` (`number`, optional)
- `deductionDayOfMonth` (`number`, optional)
- `createdAt` (`string`, ISO timestamp)
- `updatedAt` (`string`, ISO timestamp)

Dexie store:
```text
++id, familyId, personId, frequency, type, updatedAt
```

Indexes:
- PK: `id`
- Secondary: `familyId`, `personId`, `frequency`, `type`, `updatedAt`

### 2.4 `monthlySpendEntries`
Purpose: month-specific materialized spend records used for status tracking and reporting.

Fields:
- `id` (`number`, PK, auto-increment)
- `familyId` (`number`, FK -> `families.id`)
- `templateId` (`number`, FK -> `spendTemplates.id`)
- `personId` (`number`, optional FK -> `persons.id`)
- `monthKey` (`string`, format `YYYY-MM`)
- `type` (`string`, required)
- `name` (`string`, required)
- `cost` (`number`, required)
- `quantity` (`string`, required)
- `status` (`'Spent' | 'Not Yet' | 'Skip'`)
- `usage` (`number`, required)
- `manuallyUpdatedStatus` (`boolean`, required)
- `createdAt` (`string`, ISO timestamp)
- `updatedAt` (`string`, ISO timestamp)

Dexie store:
```text
++id, familyId, templateId, personId, monthKey, status, type, updatedAt
```

Indexes:
- PK: `id`
- Secondary: `familyId`, `templateId`, `personId`, `monthKey`, `status`, `type`, `updatedAt`

## 3. Relationships
- One `family` to many `persons`
- One `family` to many `spendTemplates`
- One `spendTemplate` to many `monthlySpendEntries`
- `personId` is optional in both `spendTemplates` and `monthlySpendEntries`

Note: IndexedDB/Dexie does not enforce FK constraints at the DB engine level. Integrity is enforced in application logic.

## 4. Enums
- `SpendFrequency`: `Monthly`, `Quarterly`, `Annually`, `AdHoc`
- `MonthlySpendStatus`: `Spent`, `Not Yet`, `Skip`

## 5. Migration Notes
When schema changes are needed:
1. Bump Dexie version in `src/shared/db/appDb.ts`.
2. Add `version(n).stores(...)` migration updates.
3. Backfill or transform existing records if shape changes.
4. Update this document and `docs/DESIGN.md` in the same PR.
