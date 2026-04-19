# SpendNest

SpendNest is a responsive, local-first family budget tracker built with React + TypeScript.

## Current Stack
- React 19 + TypeScript + Vite
- React Router for navigation
- Zustand for app/session state
- Dexie (IndexedDB) for persisted local data
- Recharts for dashboard visualizations
- Vite PWA plugin for offline app shell

## Product Scope (MVP)
- Family and person management
- Spend template management
- Monthly spend instances with status tracking (`Spent`, `Not Yet`, `Skip`)
- EMI auto-toggle behavior by deduction date
- Budget breakdown bar chart (Budget / Spent / Pending) with per-entry impact scores (1–10) and sort controls
- Category pie chart by spend type
- Light/Dark/Device theming with persistence
- Backup export/import with validation

See detailed requirements: `docs/REQUIREMENTS.md`.

## Architecture Notes
- App shell and routing live in `src/app`.
- Feature modules live in `src/features/*`.
- Shared domain types, DB adapter, and app state live in `src/shared/*`.

Design details and system diagrams: `docs/DESIGN.md`.
Database schema details: `docs/DB_SCHEMA.md`.
Firebase auth/sync setup: `docs/FIREBASE_SETUP.md`.

## Engineering Guidelines (Project Alignment)
Aligned with `.github/copilot-instructions.md`:
- Keep files modular and focused on one concern.
- Keep files small (target under ~200 lines).
- Avoid unused imports and dead code.
- Follow naming conventions already used in edited files.
- Keep docs updated when architecture or strategy changes.
- Prefer feature-based organization for new modules.

Note on refactoring policy:
- Structural refactors should be proposed and confirmed before execution.

## Development
```bash
npm install
npm run dev
```

## Quality Checks
```bash
npm run build
npm run lint
```

## PWA
Production build includes service worker + manifest for offline shell behavior.
Uses `prompt` update mode: when a new version is deployed, an in-app banner appears
letting the user explicitly refresh — reliable on both Android and iOS home-screen installs.

## Cloudflare Pages Deployment
Deployment guide: `docs/CLOUDFLARE_PAGES.md`.
