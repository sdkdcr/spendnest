# Cloudflare Pages Deployment

## 1. Prerequisites
- Git repository with the SpendNest project
- Cloudflare account

## 2. Create Pages Project
1. Open Cloudflare Dashboard -> `Workers & Pages` -> `Create` -> `Pages`.
2. Connect your Git provider and select the SpendNest repository.
3. Configure build settings:
   - Framework preset: `None`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (project root)

## 3. Environment
No mandatory runtime secrets are required for current local-first MVP.

## 4. SPA Routing
SpendNest is a client-side routed SPA.
Cloudflare Pages should serve `index.html` for app routes.

Add this file in project root before deploy:

```text
/public/_redirects
/* /index.html 200
```

## 5. PWA Notes
The production build includes:
- web app manifest
- service worker for app shell caching

After first load, the app should support offline shell behavior.

## 6. Verify After Deploy
1. Open deployed URL.
2. Confirm core routes load directly (for example `/spends`, `/families`).
3. Confirm app install prompt/Add-to-home-screen appears when supported.
4. Confirm offline shell loads after one successful online visit.
