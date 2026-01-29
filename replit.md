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
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Validation**: Zod schemas generated via drizzle-zod
- **Storage Abstraction**: `IStorage` interface in `server/storage.ts` with in-memory implementation (MemStorage)

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

### Complete Feature Set
- Discovery page with hero section and featured tailors
- Search page with specialty, location, rating, and price filters
- Marketplace with product cards and category filters
- Messages with conversation list and real-time chat
- Profile page with user info and menu options
- Individual tailor profiles with tabs (Portfolio, Boutique, Avis)
- Individual product detail pages
- Professional registration with profile setup flow

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