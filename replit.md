# SEAMLIER

## Overview

SEAMLIER is a bilingual (French/English) service marketplace platform connecting individuals with professional tailors and seamstresses. The platform enables users to discover tailoring artisans, browse their portfolios, purchase ready-made garments, book appointments, and communicate through in-app messaging. It emphasizes a mobile-first, premium visual experience with complete language switching using react-i18next. Pricing is always by quote, not hourly rates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Build Tool**: Vite with HMR support

### Design System
- Mobile-first responsive design with bottom navigation (5 tabs: Discovery, Search, Messages, Marketplace, Profile)
- Desktop header navigation for larger screens
- Typography: Inter (body) + Playfair Display (headings) from Google Fonts
- Photography-driven interface with card-based layouts
- Premium aesthetic inspired by fashion/tailoring industry

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON APIs under `/api/*` prefix
- **Build**: esbuild for production server bundling

### Data Layer
- **ORM**: Drizzle ORM with MySQL dialect (mysql2 driver)
- **Database**: MySQL on o2switch (podu7204_seamlier_db)
- **Connection**: mysql2/promise pool via MYSQL_DATABASE_URL env var
- **Schema Location**: `shared/schema.ts` (shared between client and server, uses mysqlTable)
- **Validation**: Zod schemas generated via drizzle-zod
- **Storage Abstraction**: `IStorage` interface in `server/storage.ts` with DatabaseStorage (MySQL)
- **ID Strategy**: App-side UUID generation (no DB defaults), all IDs are VARCHAR(36)
- **Session Store**: express-mysql-session (creates sessions table automatically)
- **Schema SQL**: `mysql-schema.sql` for manual table creation on o2switch phpMyAdmin
- **Note**: MySQL does not support `.returning()` — all inserts use INSERT + SELECT pattern

### Data Models
- **Users**: Basic user accounts with roles (client/tailor)
- **Tailors**: Professional profiles with specialties, ratings, verification badges
- **Portfolio Items**: Showcase work with images and categories
- **Products**: Marketplace items for sale
- **Reviews**: User ratings and comments for tailors
- **Conversations/Messages**: Real-time messaging between users

### Project Structure
```
client/src/          # React frontend
  components/        # Reusable UI components
  components/ui/     # shadcn/ui primitives
  pages/             # Route page components
  hooks/             # Custom React hooks
  lib/               # Utilities and query client
server/              # Express backend
  index.ts           # Server entry point
  routes.ts          # API route definitions
  storage.ts         # Data access layer
  static.ts          # Production static file serving
  vite.ts            # Development Vite middleware
shared/              # Shared code (schema, types)
```

## Recent Changes (January 2026)

### Schema Migration
- **User Schema**: Migrated from `fullName`/`avatarUrl` to `firstName`/`lastName`/`profileImageUrl` pattern
- **Database Driver Fix**: Using @neondatabase/serverless v0.10.4 for drizzle-orm compatibility
- **Portfolio API**: Updated `/api/portfolio` to return `PortfolioWithTailor[]` with proper joins to tailors and users

### Component Updates
- **TailorCard**: Uses computed fullName from firstName + lastName
- **PortfolioCard**: Now handles optional tailor.user gracefully (supports both PortfolioItem and PortfolioWithTailor)
- **ReviewCard**: Updated to use firstName/lastName/profileImageUrl
- **DesktopHeader**: Added user avatar dropdown with logout option when authenticated
- **TailorProfile**: Added getFullName()/getInitials() helper functions

### Bug Fixes (December 2024)
- **Product Detail Page**: Added `/product/:id` route and full product detail page with image, title, price, seller info, and action buttons
- **Messaging System**: Wired message sending to POST `/api/messages` with useMutation and proper cache invalidation
- **Marketplace/Search Filtering**: Migrated from malformed server-side filtering to proper client-side filtering using useMemo

### Professional Registration Flow (January 2026)
- **Replit Auth Integration**: Professionals authenticate via Replit Auth with `?role=tailor`
- **Profile Setup Page**: New professionals redirected to `/professionnel/setup` to complete profile
- **Data Storage**: User location saved to users table, specialties/experience/bio saved to tailors table
- **Search Integration**: New tailors automatically appear in search results after completing setup
- **Auth Callback Logic**: Checks for existing tailor profile; redirects to setup if missing

### Artisan Subscription Plans (February 2026)
- **Starter Plan**: 0€/mois, 15% commission artisan, 10% frais client, Mesures limitées à 10 fiches
- **Pro Plan**: 29€/mois (configurable), 0% commission artisan, 10% frais client, Mesures illimitées
- **Admin Dashboard**: Plan selection in add/edit artisan forms, plan details with commission breakdown
- **Settings**: Plans & Tarification card with side-by-side plan comparison, configurable Pro pricing

### Project Progress Tracking (February 2026)
- **Schema**: Added `currentStep` text field to projects table (default: "prise_mesures")
- **Types**: Added `ProjectWithTailor` type for client-side project queries
- **8 Fabrication Steps**: Prise de mesures → Choix du tissu → Patronage → Coupe → Assemblage → Essayage → Finitions → Prêt/Livraison
- **Pro Dashboard (pro-projets.tsx)**: Tailors click project → dialog with step timeline → click step to advance, auto-updates progress % and status
- **Client Page (mes-projets.tsx)**: Visual timeline showing current fabrication stage, accessible from `/particulier/mes-projets`
- **API Routes**: `GET /api/client/projects` (client view), `PATCH /api/projects/:id/step` (tailor updates step+progress+status)
- **Navigation**: Quick access link added to client profile page (profil-particulier.tsx)

### Production Readiness (February 2026)
- **Pro Dashboard**: Starter limit gauge (0/10 fiches with progress bar), upgrade-to-Pro modal, plan status card
- **Admin Dashboard Cleanup**: All mock data removed, empty states for all sections, real data from DB only
- **Admin Artisans Tab**: Loads real artisans from `GET /api/admin/artisans`, validate/deactivate/delete actions per artisan
- **Role Separation**: Admin sees global metrics and artisan management; Pro dashboard shows individual artisan limits
- **Sessions**: PostgreSQL session store with httpOnly/secure cookies (1-week TTL)
- **Build**: Vite frontend (670KB / 183KB gzip) + esbuild server bundle
- **Business Constants**: Starter=15% artisan com + 10 mesures, Pro=0% com + unlimited, Client=10% fees, Min order=30€

### Email Verification (February 2026)
- **Nodemailer**: SMTP-based email sending via environment variables
- **Env Vars**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `APP_URL`
- **Flow**: Register → verification email sent → user clicks link → account activated → can login
- **Schema**: `email_verified` (boolean), `verification_token` (varchar), `verification_expires` (timestamp) on users table
- **Route**: `GET /api/verify-email?token=...` validates token, marks user as verified, renders confirmation page
- **Login Block**: Users with unverified emails and active tokens cannot login until verified
- **Email Template**: Branded HTML email with burgundy #722F37 styling

### Magazine Articles (February 2026)
- **Schema**: `magazine_articles` table (id, title, category, content, excerpt, imageUrl, status, authorId, views)
- **Admin CRUD**: `GET/POST /api/admin/articles`, `PUT/DELETE /api/admin/articles/:id`
- **Public API**: `GET /api/articles` (published only), `GET /api/articles/:id`
- **Admin Dashboard**: Magazine tab now persists articles to database (was local state only)
- **Image Upload**: Base64 image upload in article creation form (MEDIUMTEXT column for storage)
- **Client Magazine Page**: Shows published articles from DB with category badges, excerpts, dates

### Contact Support Messaging (February 2026)
- **Messages Page**: "Support" button in conversation sidebar header
- **Flow**: Clicking creates/opens conversation with admin user (id: admin-001) via `POST /api/conversations`
- **Backend**: Uses existing `getOrCreateConversation()` storage method — reuses existing conversation if one exists

### Auth Architecture (February 2026)
- **Single Auth System**: Passport.js local strategy (email/password with bcrypt)
- **Auth Endpoints**: Defined in `server/replit_integrations/auth/localAuth.ts`
  - `POST /api/login`: Email/password login, returns user with role (blocks unverified emails)
  - `POST /api/register`: Registration with email verification token + sends confirmation email
  - `GET /api/auth/user`: Get current authenticated user
  - `GET /api/logout`: Logout and destroy session
- **Session Store**: MySQL via express-mysql-session (1-week TTL, httpOnly cookies)
- **Middleware**: `requireAuth` (passport isAuthenticated), `requireAdmin` (role check)
- **Frontend Auth**: `useAuth()` hook in `client/src/hooks/use-auth.ts`

### Route Structure (February 2026)
- **Public**: `/` (landing), `/connexion`, `/inscription`, `/inscription/particulier`, `/inscription/professionnel`, `/recherche`, `/profil-pro/:id`
- **Client (protected)**: `/dashboard-client`, `/decouverte`, `/mesures`, `/magazine`, `/marketplace`, `/messages`, `/mon-profil`, `/mes-projets`, `/suivi-projet/:id`, `/product/:id`, `/tailor/:id`
- **Pro (protected)**: `/dashboard-pro`, `/gestion-demandes`, `/atelier`, `/atelier/:id`, `/messagerie`, `/vitrine-pro`, `/portefeuille`, `/pro-profil`
- **Admin (protected + role=admin)**: `/admin/dashboard`
- **API Config**: `client/src/lib/api-config.ts` with `apiFetch()` helper and `API_ENDPOINTS` constants

### Complete Feature Set
- Discovery page with hero section and featured tailors
- Search page with specialty, location, rating, and price filters
- Marketplace with product cards and category filters
- Messages with conversation list and real-time chat
- Profile page with user info and menu options
- Individual tailor profiles with tabs (Portfolio, Boutique, Avis)
- Individual product detail pages
- Professional registration with profile setup flow
- Admin dashboard at `/admin/seamlier` with 10 tabs (artisans, settings, etc.)
- Pro dashboard at `/professionnel` with Starter limit gauge and upgrade path

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured via `DATABASE_URL` environment variable)
- **Drizzle Kit**: Database migrations in `./migrations` directory
- **connect-pg-simple**: PostgreSQL session store for Express

### Frontend Libraries
- **@tanstack/react-query**: Data fetching and caching
- **Radix UI**: Accessible UI primitives (dialog, dropdown, tabs, etc.)
- **Embla Carousel**: Image carousels
- **date-fns**: Date formatting utilities
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Development server with HMR
- **esbuild**: Production server bundling
- **TypeScript**: Full type safety across stack
- **Tailwind CSS**: Utility-first styling

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development environment indicator