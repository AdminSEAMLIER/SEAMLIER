# SEAMLIER

## Overview

SEAMLIER is a bilingual (French/English) service marketplace platform connecting individuals with professional tailors and seamstresses. It allows users to discover artisans, browse portfolios, book appointments, and communicate via in-app messaging. The platform supports purchasing ready-made garments, emphasizes a mobile-first, premium visual experience, and features complete language switching. Pricing is exclusively by quote.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS with CSS variables (light/dark mode)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Build Tool**: Vite
- **Design System**: Mobile-first with bottom navigation, desktop header, photography-driven card layouts, premium aesthetic. Typography uses Inter and Playfair Display.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON APIs
- **Build**: esbuild

### Data Layer
- **ORM**: Drizzle ORM (MySQL dialect)
- **Database**: MySQL
- **Validation**: Zod schemas (generated via drizzle-zod)
- **ID Strategy**: App-side UUID generation for all IDs
- **Session Store**: express-mysql-session
- **Data Models**: Users (client/tailor roles), Tailors (profiles, ratings), Portfolio Items, Products, Reviews, Conversations/Messages.
- **Project Progress Tracking**: `currentStep` field in projects table with 8 fabrication steps and visual timelines for users.

### Authentication
- **System**: Passport.js local strategy (email/password with bcrypt)
- **Flow**: Email verification on registration, login blocks unverified users.
- **Session**: MySQL session store with httpOnly/secure cookies.

### Key Features
- Artisan subscription plans (Starter/Pro) with different commission structures and feature limits.
- Admin dashboard for managing artisans, projects, appointments, and magazine articles.
- In-app messaging with support contact functionality.
- Real-time project tracking and status updates.
- Profile management for clients and tailors, including measurement profiles.
- Article management and display for a magazine section.

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured via `DATABASE_URL`)
- **Drizzle Kit**: Database migrations
- **connect-pg-simple**: PostgreSQL session store

### Frontend Libraries
- **@tanstack/react-query**: Data fetching and caching
- **Radix UI**: Accessible UI primitives
- **Embla Carousel**: Image carousels
- **date-fns**: Date formatting utilities
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Development server
- **esbuild**: Production server bundling
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling

### Services
- **Nodemailer**: SMTP-based email sending for verification.