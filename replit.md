# The Oracle's Veil - Burmese Tarot Application

## Overview

The Oracle's Veil is a premium 3D Tarot reading application designed for Myanmar users. It features an immersive 3D environment with PBR rendering, volumetric lighting, and dramatic card reveal animations. The application combines a React frontend with Three.js/React Three Fiber for 3D rendering, Express backend for API services, and Google Generative AI for tarot readings. All UI elements are presented in Burmese language to serve the Myanmar user base.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React + TypeScript with Vite build system

**3D Rendering Engine**: React Three Fiber (@react-three/fiber) with Three.js
- **Rationale**: Provides declarative React components for Three.js, enabling complex 3D scenes with familiar React patterns
- **Rendering Features**: 
  - PBR (Physically Based Rendering) materials for realistic card surfaces
  - Post-processing effects via @react-three/postprocessing (Bloom, Chromatic Aberration, Depth of Field, Vignette, SSAO, God Rays)
  - GLSL shader support through vite-plugin-glsl for custom visual effects
  - Volumetric lighting and ambient occlusion for atmospheric depth

**UI Component Library**: Radix UI primitives with custom styling
- **Rationale**: Provides accessible, unstyled components that can be fully customized for the luxury dark/light mode aesthetic
- **Styling**: TailwindCSS for utility-first styling with custom color palette (deep navy, pitch black, gold/amber accents)

**State Management**: 
- Zustand for global state (game phase, audio controls)
- TanStack Query (@tanstack/react-query) for server state management
- **Rationale**: Lightweight state management without Redux boilerplate; TanStack Query handles caching and synchronization of server data

**Audio System**: Tone.js integration with custom audio store
- Manages background music, hit sounds, and success sounds
- Mute/unmute functionality with default muted state

**Routing**: Wouter for lightweight client-side routing
- **Rationale**: Minimal routing library suitable for small applications with few routes

### Backend Architecture

**Server Framework**: Express.js with TypeScript
- **Session Management**: express-session with in-memory store
- **Security**: HTTP-only cookies, CSRF protection via sameSite: 'lax'

**API Structure**:
- Admin authentication via keyword ("oracle")
- Token generation system for controlled access
- Session-based admin authorization

**Development Mode**: Vite middleware integration for HMR and dev server
- **Production Mode**: Static file serving from dist/public directory

### Data Storage Solutions

**Database**: PostgreSQL via Neon serverless (@neondatabase/serverless)
- **Rationale**: Serverless PostgreSQL eliminates infrastructure management while providing full SQL capabilities

**ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema Location**: `shared/schema.ts` for type sharing between client and server
- **Rationale**: Type-safe database queries with minimal runtime overhead; schema migrations via drizzle-kit push command

**Database Schema**:
```typescript
users table:
  - id (serial, primary key)
  - username (text, unique)
  - password (text)

access_tokens table:
  - id (serial, primary key)
  - token (text, unique)
  - used (boolean, default false)
  - createdAt (timestamp)
```

### Authentication and Authorization

**Admin Access**: Keyword-based authentication ("oracle")
- Session regeneration on successful login
- Session cookie with 24-hour expiration
- Secure flag enabled in production

**Token System**: Generated tokens (nanoid, 12 characters) for user access control
- Tokens marked as "used" after redemption
- Prevents token reuse

### External Dependencies

**Google Generative AI**: @google/generative-ai package
- **Purpose**: Generate tarot card readings and interpretations
- **Configuration**: API key required via GOOGLE_API_KEY environment variable
- **Integration Point**: Backend API routes for reading generation

**Neon Database**: @neondatabase/serverless
- **Purpose**: Serverless PostgreSQL database hosting
- **Configuration**: DATABASE_URL environment variable
- **Alternatives Considered**: Traditional PostgreSQL, but serverless chosen for zero-maintenance scaling

**Font Resources**: @fontsource/inter for consistent typography
- Self-hosted fonts to ensure offline availability and performance

**3D Asset Support**: 
- GLTF/GLB model loading via @react-three/drei
- Custom asset inclusion for .gltf, .glb, .mp3, .ogg, .wav files

**Development Tools**:
- @replit/vite-plugin-runtime-error-modal for enhanced error display during development
- esbuild for production server bundling (fast compilation)

### Build and Deployment Configuration

**Development**: `tsx server/index.ts` for hot-reloading TypeScript server
**Production Build**: 
  1. Vite builds client to dist/public
  2. esbuild bundles server to dist/index.js (ESM format, external packages)
**Start**: Node.js runs bundled server with NODE_ENV=production

**Path Aliases**: 
- `@/*` maps to `client/src/*`
- `@shared/*` maps to `shared/*`
- Enables clean imports across client and shared code

**TypeScript Configuration**: Strict mode enabled with ESNext modules, bundler module resolution for optimal tree-shaking