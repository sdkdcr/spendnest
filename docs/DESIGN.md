# SpendNest Design

## 1. Purpose
This document describes SpendNest architecture, data model, and key runtime flows.
It complements `docs/REQUIREMENTS.md` and should be updated when design decisions change.

## 2. System Context
```mermaid
flowchart LR
  U[User] --> B[Mobile or Desktop Browser]
  B --> SPA[SpendNest React SPA]
  SPA --> IDX[(IndexedDB via Dexie)]
  SPA -. optional backup .-> G[Google Drive Backup - future]
  SPA -. deploy .-> CF[Cloudflare Pages]
```

## 3. Frontend Container View
```mermaid
flowchart TD
  M[main.tsx] --> R[routes.tsx]
  R --> S[AppShell]
  S --> P1[DashboardPage]
  S --> P2[SpendsPage]
  S --> P3[FamiliesPage]
  S --> P4[SettingsPage]

  S --> ST[Zustand Store]
  ST --> TH[Theme Runtime]

  P1 --> DB[(Dexie DB)]
  P2 --> DB
  P3 --> DB
  P4 --> ST

  DB --> T1[families]
  DB --> T2[persons]
  DB --> T3[spendTemplates]
  DB --> T4[monthlySpendEntries]
```

## 4. Data Model (Logical)
```mermaid
erDiagram
  FAMILY ||--o{ PERSON : has
  FAMILY ||--o{ SPEND_TEMPLATE : owns
  PERSON ||--o{ SPEND_TEMPLATE : optional_tag
  SPEND_TEMPLATE ||--o{ MONTHLY_SPEND_ENTRY : materializes_into
  FAMILY ||--o{ MONTHLY_SPEND_ENTRY : groups
  PERSON ||--o{ MONTHLY_SPEND_ENTRY : optional_tag

  FAMILY {
    int id PK
    string name
    string createdAt
    string updatedAt
  }

  PERSON {
    int id PK
    int familyId FK
    string name
    string createdAt
    string updatedAt
  }

  SPEND_TEMPLATE {
    int id PK
    int familyId FK
    int personId FK
    string type
    string name
    string frequency
    number cost
    string quantity
    number emiAmount
    int deductionDayOfMonth
    string createdAt
    string updatedAt
  }

  MONTHLY_SPEND_ENTRY {
    int id PK
    int familyId FK
    int templateId FK
    int personId FK
    string monthKey
    string type
    string name
    number cost
    string quantity
    string status
    number usage
    boolean manuallyUpdatedStatus
    string createdAt
    string updatedAt
  }
```

## 5. Monthly Spend Lifecycle
```mermaid
sequenceDiagram
  participant User
  participant UI as SpendNest UI
  participant Engine as Monthly Engine
  participant DB as IndexedDB

  User->>UI: Open month (YYYY-MM)
  UI->>Engine: Ensure monthly entries exist
  Engine->>DB: Read spend templates + existing month entries
  Engine->>Engine: Apply frequency rules
  Engine->>Engine: Carry forward defaults and prior cost
  Engine->>DB: Insert missing monthly entries
  DB-->>UI: Return monthly entries
  UI-->>User: Render grouped spends for selected month
```

Frequency rule details:
- `Monthly`: include on/after template `createdAt` month.
- `AdHoc`: include on/after template `createdAt` month.
- `Quarterly`: include when elapsed months from template `createdAt` month is divisible by `3`.
- `Annually`: include when elapsed months from template `createdAt` month is divisible by `12`.

## 6. EMI Auto-Toggle Flow
```mermaid
flowchart TD
  A[Monthly entry loaded] --> B{Template has EMI?}
  B -- No --> C[Keep current status]
  B -- Yes --> D{Current date >= deduction day?}
  D -- No --> C
  D -- Yes --> E{Status manually overridden?}
  E -- Yes --> C
  E -- No --> F[Set status to Spent]
```

## 7. Theming Flow
```mermaid
flowchart TD
  I[App startup] --> L[Read localStorage theme mode]
  L --> M{Stored mode exists?}
  M -- Yes --> A[Use stored mode]
  M -- No --> D{Device theme supported?}
  D -- Yes --> E[Use Device mode]
  D -- No --> F[Fallback to Dark]

  A --> R[Resolve effective light/dark]
  E --> R
  F --> R

  R --> H[Apply html data-theme and color-scheme]
  H --> S[User can override in Settings]
```

## 8. Directory Strategy
Current baseline structure:
- `src/app` for shell, bootstrap, and route registration
- `src/features/dashboard` for dashboard route UI
- `src/features/families` for family route UI
- `src/features/spends` for spend route UI
- `src/features/settings` for settings route UI
- `src/features/not-found` for fallback route UI
- `src/features/theme` for theme types and runtime logic
- `src/shared/domain` for shared domain models
- `src/shared/db` for IndexedDB adapter
- `src/shared/state` for global app state

Ongoing strategy:
- Add new business capabilities under `src/features/<feature-name>`.
- Keep cross-feature primitives in `src/shared/*`.
- Propose and confirm large structural refactors before execution.

## 9. Design Constraints
- Local-first operation with IndexedDB persistence.
- Mobile-first responsive behavior with desktop support.
- PWA-first deployment model; optional Capacitor packaging later.
- Keep model and storage boundaries explicit so backup/restore and future sync remain straightforward.

## 10. Backup Format
- Export format: JSON file with `backupVersion: 1`.
- Payload includes: `families`, `persons`, `spendTemplates`, `monthlySpendEntries`.
- Import path validates JSON schema before restore.
- Current restore mode: replace existing local data (transactional clear + bulk restore).
