# SpendNest Requirements

## 1. Objective
SpendNest is a personal/family budgeting app focused on monthly spend tracking, recurring obligations, and simple analytics.

Primary goals:
- Track planned and ad-hoc spends by family/person.
- Reuse prior month spend templates without repetitive data entry.
- Give a clear monthly view of status and total expenditure.
- Keep data local-first and easy to back up/restore.

## 2. Product Strategy
### 2.1 Platform Strategy
- Build first as a responsive web app (PWA-capable) for mobile and laptop browsers.
- Host on Cloudflare Pages (free tier).
- Preserve architecture so the same React codebase can later be packaged via Capacitor for app-store publication.

### 2.2 Data Strategy
- Local-first persistence using IndexedDB.
- Export/import backups as initial safety mechanism.
- Add cloud sync using Firebase Firestore to support multi-device usage.
- Use Firebase Authentication with Google Sign-In for user identity/session.
- Keep IndexedDB as offline/local cache and sync with Firestore when online.
- Target audience is internal usage (~20-30 users), so design for low operational overhead and free-tier-first usage.

### 2.3 UX Strategy
- Mobile-first UI that scales to desktop.
- Fast month switching and low-friction status updates.
- Clear visual summary (monthly total + category split pie chart).
- Built-in theme support for light and dark modes.

## 3. Scope
### 3.1 In Scope (MVP)
- Family and person management.
- Spend template creation and edit.
- Monthly spend instances generated from templates.
- Status tracking per month: `Spent`, `Not Yet`, `Skip`.
- EMI auto-marking logic by deduction day.
- Monthly total expenditure.
- Pie chart by spend category/type.
- Theming: `Light`, `Dark`, and `Device` preference mode.
- Responsive layouts for phone and desktop browser.
- Manual backup/restore (JSON/CSV acceptable for MVP).
- Google authentication (Firebase Auth, Google provider).
- Multi-device data sync via Firebase Firestore.

### 3.2 Out of Scope (MVP)
- Bank integrations and automatic transaction ingestion.
- Advanced forecasting, AI insights, or tax workflows.
- Multi-currency accounting complexity.

## 4. Functional Requirements
### 4.1 Family and Person
- User can create at least one family.
- A family can have one or more persons.
- A spend must belong to a family.
- A spend may optionally be tagged to one person in that family.

### 4.2 Spend Definition (Template)
Each spend template supports:
- `type` (Insurance, Transport, Utility, etc.)
- `name`
- `frequency` (`Monthly`, `Quarterly`, `Annually`, `AdHoc`)
- `cost`
- `quantity` (free text, e.g., `5 Liters`, `10 Stocks`)
- optional EMI configuration:
  - `emiAmount`
  - `deductionDayOfMonth` (1-31)

### 4.3 Monthly Spend Instance
- Spends are tracked by selected month (YYYY-MM).
- On opening a month, eligible templates are carried forward into monthly instances.
- Frequency eligibility rule:
  - `Monthly`: eligible for every month on/after template `createdAt` month.
  - `AdHoc`: eligible for every month on/after template `createdAt` month.
  - `Quarterly`: eligible when elapsed months from template `createdAt` month is divisible by 3.
  - `Annually`: eligible when elapsed months from template `createdAt` month is divisible by 12.
- New monthly instance initializes usage defaults to zero/empty as defined.
- Cost defaults from previous month when applicable.
- Monthly instance status supports:
  - `Spent`
  - `Not Yet`
  - `Skip`

### 4.4 EMI Auto-Status
- For a spend with EMI config, when current date in selected month is on/after `deductionDayOfMonth`, status should auto-toggle to `Spent` unless user explicitly changed status later.
- User can still manually override status.

### 4.5 Dashboard and Reporting
- Show total expenditure for selected month.
- Show category-wise pie chart for selected month.
- Expenditure calculations include entries marked `Spent` only (default rule for MVP).

### 4.6 Backup and Restore
- User can export all app data to file.
- User can import backup file to restore data.
- Validation should reject malformed backups with clear error messaging.

### 4.7 Authentication and Multi-Device Sync
- User can sign in with Google account.
- App data is isolated per authenticated user (or explicit shared family model if introduced).
- Data written on one device should be available on another signed-in device after sync.
- IndexedDB remains the local source for offline UX; Firestore is the cloud source for cross-device continuity.
- Sync should be resilient to temporary offline conditions and retry when connectivity returns.
- On first sign-in on a new device, app should pull the latest cloud data before allowing conflicting edits.
- Basic conflict policy for MVP: last-write-wins at record level using `updatedAt` timestamps.

### 4.8 Theming
- App supports three theme modes:
  - `Dark`
  - `Light`
  - `Device` (follow OS/browser `prefers-color-scheme` if available)
- Default mode should be `Device` when available; otherwise fall back to `Dark`.
- User can switch theme mode in settings.
- Theme choice should persist locally across app restarts.

## 5. Non-Functional Requirements
### 5.1 Responsiveness
- Mobile usability first (small viewport baseline).
- Desktop layout remains fully functional and readable.
- Test targets: 360, 390, 768, 1024, 1440 width breakpoints.

### 5.2 Reliability
- App should work offline after initial load.
- Local data operations should be resilient against refresh/reopen.
- Theme preference should remain stable across reloads.
- Sync failures should surface clear non-blocking messaging and allow retry.

### 5.3 Performance
- Month dashboard should render quickly for small-to-medium personal datasets.
- Common interactions (toggle status, add spend) should feel immediate.

### 5.4 Maintainability
- Type-safe models and validation.
- Clear separation of template spends vs monthly instances.

## 6. Suggested Data Model (High-Level)
- `families`
- `persons`
- `spend_templates`
- `monthly_spend_entries`
- `emi_rules` (or embedded under template)
- `app_settings`

## 7. Implementation Plan
### Phase 1: Foundation
- React + TypeScript + routing + state + IndexedDB setup.
- Base responsive shell and navigation.

### Phase 2: Core Budget Flow
- Family/person CRUD.
- Spend template CRUD.
- Monthly generation and status toggles.
- EMI auto-toggle rule.

### Phase 3: Insights + Data Safety
- Monthly total and category pie chart.
- Export/import backup flow.

### Phase 4: PWA + Deployment
- PWA installability and offline shell.
- Deploy to Cloudflare Pages.

### Phase 5: Auth + Cloud Sync
- Firebase project setup and environment wiring.
- Google Sign-In via Firebase Authentication.
- Firestore data model and security rules.
- Bidirectional sync between IndexedDB and Firestore.
- Conflict handling (last-write-wins for MVP).

### Phase 6 (Future)
- Optional Google Drive backup integration in addition to Firestore sync.
- Capacitor packaging for iOS/Android distribution.

## 8. Acceptance Criteria (MVP)
- User can create family, persons, and spend templates.
- Month view auto-populates eligible spends with correct defaults.
- User can update status (`Spent`/`Not Yet`/`Skip`) quickly.
- EMI spend can auto-mark as `Spent` after configured day.
- Dashboard shows monthly total and category pie chart.
- App is usable on both mobile and laptop browsers.
- Data persists locally across reloads and can be exported/imported.

## 9. Open Decisions
- Whether skipped spends should appear in totals as zero (default assumed).
- Conflict behavior when importing backup over existing data (merge vs replace).
- Firestore collection shape (`per-user` vs `shared-family`) for internal collaboration model.
- Whether backup import should write to local-only first or propagate immediately to Firestore.

## 10. Task Tracker
| Task | Status |
| --- | --- |
| Project foundation: React + TypeScript + routing + state + IndexedDB scaffold | - [x] |
| Responsive app shell and navigation (mobile-first, desktop-friendly) | - [x] |
| Family CRUD | - [x] |
| Person CRUD (linked to family) | - [x] |
| Spend template CRUD (`type`, `name`, `frequency`, `cost`, `quantity`) | - [x] |
| Optional spend-to-person tagging | - [x] |
| Monthly instance generation from templates | - [x] |
| Frequency rules (`Monthly`, `Quarterly`, `Annually`, `AdHoc`) | - [x] |
| Monthly status workflow (`Spent`, `Not Yet`, `Skip`) | - [x] |
| Cost auto-population from previous month | - [x] |
| EMI fields (`emiAmount`, `deductionDayOfMonth`) | - [x] |
| EMI auto-toggle to `Spent` after configured day | - [x] |
| Monthly total expenditure calculation | - [x] |
| Category/type pie chart visualization | - [x] |
| Theme system (`Light` / `Dark` / `Device`) with persisted preference | - [x] |
| Backup export (JSON/CSV) | - [x] |
| Backup import with validation | - [x] |
| Offline-ready behavior (PWA shell) | - [x] |
| Cloudflare Pages deployment setup | - [x] |
| Firebase project setup (Auth + Firestore) | - [x] |
| Google Sign-In integration | - [x] |
| Firestore security rules for internal app usage | - [ ] |
| IndexedDB <-> Firestore sync engine | - [x] |
| Manual sync controls (`Sync now`, optional auto-sync toggle) | - [x] |
| Dashboard spend-card editing (`cost`, `quantity`) | - [x] |
| Dashboard person-level filter with family default scope | - [x] |
| Consistent category color mapping (chart + spend ribbons) | - [x] |
| Modal-based add/edit flows (Spends + Dashboard) | - [x] |
| Cross-device sync validation (20-30 internal users target) | - [ ] |
