# PhulariStay AI

PhulariStay AI is a full-stack homestay discovery and AI travel-planning platform for Uttarakhand. It combines authenticated user flows, owner CRUD tools, PostgreSQL-backed homestay data, and a Gemini-powered itinerary planner.

## Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend: Express.js, Prisma, PostgreSQL
- Authentication: JWT, Google OAuth
- AI: Google Gemini
- UI: reusable Loader, Toast, Modal, Button, protected routes, error boundaries

## Getting Started

Install frontend dependencies:

```bash
npm install
npm run dev
```

Install backend dependencies:

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

Frontend runs locally at:

```text
<frontend-dev-url>
```

Backend runs locally at:

```text
<backend-dev-url>
```

## Environment Variables

Frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=<backend-api-url>/api
```

Backend `backend/.env`:

```env
DATABASE_URL=
PORT=5000
CLIENT_URL=<frontend-url>
CLIENT_URLS=<frontend-url>,<optional-preview-url>
PUBLIC_API_URL=<backend-api-url>
NODE_ENV=development
JWT_SECRET=
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=<backend-api-url>/api/auth/google/callback
GEMINI_API_KEY=
```

## Frontend Architecture

The frontend uses the App Router under `app/` with route-level pages:

- `/` fetches live homestays from the backend.
- `/dashboard` is authenticated and displays real user context plus live homestay totals.
- `/profile` fetches the authenticated user.
- `/owner` is role-protected for `OWNER` and `ADMIN` and provides homestay CRUD.
- `/ai` is authenticated and provides the Gemini route planner.
- `/login` and `/register` handle auth entry points.

Shared UI and state live under `components/`:

- `AuthContext` bootstraps JWT sessions from local storage and refreshes user state with `/auth/me`.
- `ProtectedRoute` redirects guests to `/login` and role-mismatched users to `/dashboard`.
- `ErrorBoundary` prevents blank screens in critical interactive flows.
- `components/ui` contains reusable Button, Loader, Modal, and Toast components.

Service modules under `services/` centralize backend access and prevent duplicated fetch logic.

## API Integration

All frontend API calls use the shared Axios client in `lib/api.ts`. The client:

- normalizes `NEXT_PUBLIC_API_URL`
- attaches `Authorization: Bearer <token>` when a JWT exists
- applies request timeouts
- exposes reusable error-message handling

Primary frontend services:

- `services/auth.service.ts`
- `services/homestay.service.ts`
- `services/ai.service.ts`

Important API routes:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
GET  /api/auth/google

GET    /api/homestays
GET    /api/homestays/:id
POST   /api/homestays
PUT    /api/homestays/:id
DELETE /api/homestays/:id

POST /api/ai/travel-plan
```

## Authentication Flow

1. Users register or log in with email and password, or use Google OAuth.
2. The backend returns a JWT and user DTO.
3. The frontend stores the JWT and user in local storage.
4. Axios attaches the JWT to protected requests.
5. `AuthProvider` calls `GET /api/auth/me` on reload to verify the session.
6. `ProtectedRoute` gates dashboard, profile, owner CRUD, and AI planner routes.
7. Logout clears local storage and calls the backend logout route.

Role protections:

- `/dashboard`, `/profile`, and `/ai` require authentication.
- `/owner` requires `OWNER` or `ADMIN`.
- Homestay create/update/delete routes require `OWNER` or `ADMIN`; update/delete also enforce ownership unless the user is `ADMIN`.

## AI Feature

The AI Planner at `/ai` is powered by Gemini through the backend. Users provide:

- From
- Destination
- Duration
- Budget
- Travel style
- Interests

The backend queries matching homestays from PostgreSQL and injects them into the Gemini prompt. The prompt instructs Gemini to recommend only database-provided homestays and avoid invented names, prices, amenities, ratings, addresses, or availability.

Frontend AI features:

- animated skeleton while Gemini responds
- markdown rendering with tables, lists, headings, code, and constrained images
- copy response
- download PDF
- local-storage plan history
- per-plan delete and selected-plan delete
- route-level and component-level error boundaries

## Folder Structure

```text
app/
  ai/
  dashboard/
  login/
  owner/
  profile/
  register/
components/
  ui/
  AuthContext.tsx
  ErrorBoundary.tsx
  ProtectedRoute.tsx
services/
  ai.service.ts
  auth.service.ts
  homestay.service.ts
lib/
  api.ts
types/
  homestay.ts
backend/
  prisma/
  src/
    controllers/
    middleware/
    routes/
    services/
    utils/
```

## Week 8 Deliverables

- Zero frontend mock homestay/dashboard data
- Authenticated dashboard
- Protected profile, dashboard, owner CRUD, and AI planner
- Complete homestay create/read/update/delete flow
- Polished AI Planner
- Responsive layouts for mobile, tablet, and desktop
- Loading states
- Empty states
- Error handling
- Error boundaries
- Toast feedback
- Reusable API services
- Reusable Loader, Toast, Modal, and Button components

## Verification

Run before submission:

```bash
npm run lint
npm run build
```

Backend health should be checked with the backend server running and environment variables configured.

## Deployment

### Vercel Frontend

Set the frontend environment variable:

```env
NEXT_PUBLIC_API_URL=<render-backend-url>/api
```

Build command:

```bash
npm run build
```

The frontend expects the backend URL to come from `NEXT_PUBLIC_API_URL`; no local backend URL is required in production.

### Render Backend

Set the backend environment variables:

```env
DATABASE_URL=<postgresql-connection-string>
CLIENT_URL=<vercel-frontend-url>
CLIENT_URLS=<vercel-frontend-url>,<optional-vercel-preview-url>
PUBLIC_API_URL=<render-backend-url>
NODE_ENV=production
JWT_SECRET=<strong-secret>
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_CALLBACK_URL=<render-backend-url>/api/auth/google/callback
GEMINI_API_KEY=<gemini-api-key>
```

Build command:

```bash
npm install && npx prisma generate
```

Start command:

```bash
cd backend && npm start
```

Run pending SQL migrations before deployment or through a trusted database console if Prisma migrate is unavailable in the hosted environment.

## Database Schema

![ER Diagram](docs/database_design-1.png)
