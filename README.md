This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



## Database

**Database:** PostgreSQL

**Hosting:** Supabase Free Tier

**ORM:** Prisma

### Setup

```bash
cd backend

npm install

npx prisma generate

npm run dev
```

Required environment variables:

```
DATABASE_URL
PORT
CLIENT_URL
NODE_ENV
JWT_SECRET
JWT_EXPIRES_IN
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
GEMINI_API_KEY
```

Frontend environment variables:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Authentication Flow

PhulariStay AI uses JWT authentication for API access.

- Users register with `name`, `email`, `password`, and `role`.
- Passwords are hashed with bcrypt before storage.
- Public registration allows only `USER` and `OWNER`; `ADMIN` accounts must be created administratively.
- Login returns a JWT that expires in 7 days by default.
- The frontend stores the JWT in `localStorage` and sends it through the Axios `Authorization: Bearer <token>` header.
- `GET /api/auth/me` refreshes the frontend user session after page reloads.
- Logout clears the local session and calls the backend logout endpoint.

Protected backend mutations:

- `POST /api/homestays` requires `OWNER` or `ADMIN`.
- `PUT /api/homestays/:id` requires the owning `OWNER` or `ADMIN`.
- `DELETE /api/homestays/:id` requires the owning `OWNER` or `ADMIN`.
- `POST /api/bookings` requires an authenticated user.
- `POST /api/reviews` requires an authenticated user.

Protected frontend routes:

- `/dashboard`
- `/profile`
- `/owner` for `OWNER` and `ADMIN`

## Google OAuth Setup

Create OAuth credentials in Google Cloud Console and add this callback URL:

```
http://localhost:5000/api/auth/google/callback
```

Set these backend environment variables:

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CLIENT_URL=http://localhost:3000
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
```

Google login starts at:

```
GET /api/auth/google
```

## AI Feature

PhulariStay AI includes an AI Travel Planner powered by Google Gemini 2.5 Flash.
Users can open `/ai`, enter a destination in Uttarakhand, duration, budget,
travel style, and interests, then generate a markdown travel plan.

Before calling Gemini, the backend queries PostgreSQL through Prisma for
homestays matching the destination by name, location, or address. The prompt
includes only those database homestays and instructs Gemini not to invent stay
names, prices, amenities, ratings, addresses, or availability.

The backend endpoint is:

```
POST http://localhost:5000/api/ai/travel-plan
```

Example request:

```json
{
  "destination": "Auli",
  "days": 3,
  "budget": 15000,
  "travelStyle": "Family",
  "interests": "Snow, Trekking, Local Food"
}
```

Example response:

```json
{
  "success": true,
  "plan": "## Short Overview\n..."
}
```

The Gemini API key must be stored only in `backend/.env`:

```
GEMINI_API_KEY=your-gemini-api-key
```

To obtain a Gemini API key:

1. Visit Google AI Studio.
2. Sign in with a Google account.
3. Open API keys and create a new key.
4. Add the key to `backend/.env`.
5. Restart the backend server.



## Database Schema
![ER Diagram](docs/database_design-1.png)

---
