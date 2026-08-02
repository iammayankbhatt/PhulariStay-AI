# PhulariStay AI

PhulariStay AI is a full-stack homestay discovery and AI travel-planning platform for Uttarakhand. It includes authenticated guest and owner flows, PostgreSQL-backed homestay data, booking management, reviews, wishlists, and a Gemini-powered itinerary planner.

## Live Demo

Frontend URL: `https://phulari-stay-ai.vercel.app/`

Backend URL: `https://phularistay-ai.onrender.com/`

## Tech Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express.js, Prisma
- Database: Supabase PostgreSQL
- Authentication: JWT, Google OAuth
- AI: Google Gemini
- Deployment: Vercel frontend, Render backend, Supabase database

## Deployment

### Frontend Deployment

Deploy the root Next.js app to Vercel.

Set this Vercel environment variable:

```env
NEXT_PUBLIC_API_URL=<render-backend-url>/api
```

Build command:

```bash
npm run build
```

The frontend uses `NEXT_PUBLIC_API_URL` through `lib/api.ts` for API requests. The login page also uses the same normalized API base URL for Google OAuth.

### Backend Deployment

Deploy the `backend/` service to Render.

Recommended Render build command:

```bash
npm install && npx prisma generate
```

Recommended Render start command:

```bash
npm start
```

The backend listens on `process.env.PORT` through `src/config/env.js`, which is required for Render.

### Environment Variables

Store production secrets only in Vercel, Render, and Supabase dashboards. Do not commit real `.env` files or API keys.

Run all Prisma migrations against Supabase before production use:

```bash
npx prisma migrate deploy
```

## Environment Variables

### Frontend

```env
NEXT_PUBLIC_API_URL=<render-backend-url>/api
```

### Backend

```env
DATABASE_URL=<supabase-postgresql-connection-string>
JWT_SECRET=<strong-secret>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_CALLBACK_URL=<render-backend-url>/api/auth/google/callback
GEMINI_API_KEY=<gemini-api-key>
FRONTEND_URL=<vercel-frontend-url>
CLIENT_URLS=<vercel-frontend-url>,<optional-preview-url>
PUBLIC_API_URL=<render-backend-url>
NODE_ENV=production
PORT=<render-provided-port>
```

## Production Checklist

- Homepage: lists live homestays from the backend.
- Dashboard: protected JWT route with user booking and AI history data.
- Homestay Details: displays rooms, availability, reviews, booking, and map.
- Booking: protected route action using `/api/bookings`.
- Owner Dashboard: role-protected owner/admin management workflow.
- Reviews: authenticated create/update/delete and owner reply support.
- Wishlist: authenticated favorites workflow.
- AI Planner: authenticated Gemini travel-plan generation.
- Login: email/password login and Google OAuth entry.
- Register: account creation with JWT session storage.
- Logout: clears frontend session and calls backend logout.
- Google OAuth: backend Passport strategy redirects to frontend dashboard.
- Protected Routes: handled by `components/ProtectedRoute.tsx`.

## API And Auth Notes

- Frontend API calls are centralized through `lib/api.ts`.
- JWTs are stored in browser local storage and attached as `Authorization: Bearer <token>`.
- Backend JWT verification is handled by `src/middleware/auth.js`.
- CORS uses configured frontend origins from `CLIENT_URLS`, or `FRONTEND_URL` through `CLIENT_URL`.
- Google OAuth requires `GOOGLE_CALLBACK_URL` to match an approved redirect URI in Google Cloud Console.
- Gemini requests are executed only on the backend, so `GEMINI_API_KEY` is not exposed to the browser.
- Prisma uses `DATABASE_URL` from the environment and the PostgreSQL provider for Supabase.

## Known Limitations

- Render free tier services can cold start after inactivity.
- Gemini API free tier usage limits can delay or block AI planner responses.
- Google OAuth requires approved redirect URIs before sign-in works in production.

## Local Development

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

Use placeholder env files as templates and keep real credentials out of source control.

## Database Schema

![ER Diagram](docs/database_design-1.png)
