# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Express + Vite on port 5000)
npm run build      # Build client (Vite → dist/public/) + server (esbuild → dist/index.cjs)
npm start          # Run production build
npm run check      # TypeScript type checking (no emit)
npm run db:push    # Push Drizzle schema changes to database
```

No test suite is configured.

## Architecture

Full-stack TypeScript monorepo: React 18 frontend + Express backend, all ESM modules.

**Key directories:**
- `client/src/` — React app (pages, components, hooks, i18n translations)
- `server/` — Express API, all routes in a single `routes.ts` (122KB)
- `shared/schema.ts` — Single source of truth: Drizzle ORM table definitions + Zod validation schemas used by both client and server

**Path aliases:** `@/*` → `client/src/*`, `@shared/*` → `shared/`

**Routing:** Wouter (not React Router). Routes defined in `client/src/App.tsx`.

**Data fetching:** TanStack React Query. API base configured in `client/src/lib/api-config.ts`.

## Database

MySQL in production (mysql2 driver), configured via `DATABASE_URL`. Drizzle ORM with schema in `shared/schema.ts`. Sessions stored in MySQL via express-mysql-session.

Key tables and their relationships:
- `users` — base table for all accounts (role: `client` | `tailor`)
- `tailors` — extended profile for professionals, linked 1:1 to users
- `projects` — core commission model with 8-step fabrication flow tracked via `currentStep`
- `conversations` / `messages` — peer-to-peer messaging
- `measurements` — one-per-user body measurements

**8-step project flow** (`currentStep` enum): `prise_mesures` → `choix_tissu` → `devis` → `paiement` → `fabrication` → `essayage` → `finitions` → `livraison`

## Authentication

Passport.js local strategy + express-session + bcryptjs. Email verification is required before login (token stored in `users.verificationToken`). Sessions are MySQL-backed.

User roles: `client` (books services) and `tailor`/`professionnel` (provides services, has a `tailors` row).

## Payments

Stripe integration: clients pay the platform (paymentIntentId), platform transfers to tailor (transferId). Commission split tracked in `amountTotal` vs `amountArtisan` fields on projects. Stripe subscription billing manages tailor plan tiers (Starter/Pro). Webhook handling is in `server/routes.ts`.

## Frontend Notes

**Styling:** Tailwind CSS with a Burgundy/Beige theme via CSS variables in `client/src/index.css`. Dark mode via `.dark` class. Custom fonts: Inter (body) + Bodoni Moda (accent serif).

**Layout:** Mobile-first. Bottom nav for mobile (`components/bottom-nav.tsx`), desktop header for ≥1024px (`components/desktop-header.tsx`).

**i18n:** French/English via i18next. Translation files in `client/src/i18n/`. Language toggle component in `components/language-toggle.tsx`.

**PWA:** vite-plugin-pwa with Workbox for offline support and auto-update.

**Code splitting:** Manual Vite chunks for `react-vendor`, `ui-vendor`, `query`, `pdf`, `stripe`.

## UI Components

shadcn/ui components live in `client/src/components/ui/` — treat these as third-party (auto-generated). Custom app components are in `client/src/components/`.
