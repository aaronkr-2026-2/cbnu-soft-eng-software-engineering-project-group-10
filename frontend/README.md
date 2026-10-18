# CampusFind frontend

Next.js App Router frontend with React, TypeScript, Tailwind CSS v4, and Lucide icons.

## Run locally

From this directory:

```bash
npm install
npm run dev
```

Open http://localhost:3000. Validation commands: `npm run lint` and `npm run build`.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Homepage with shared listings, keyword search, and lost/found filters |
| `/items` | Browse, search, filter by type/category/location/recovery, and sort |
| `/items/[id]` | Details, email contact, and owner management actions |
| `/items/[id]/edit` | Edit a post owned by the current demo session |
| `/login`, `/register` | Create a browser-local demo session |
| `/post` | Report a lost or found item; sign-in required |
| `/my-posts` | Current user's reports and recovery counts |
| `/profile` | Update display name and log out |
| `/tasks` | Backend tasks demo with email/password login and token logout |

The new routes were integrated from `CampusFind-New-Routes-Patch`. The homepage keeps its hero, search, process, and call-to-action sections while sharing navigation and listing data with the new routes. Patch styles have been merged into the existing Tailwind v4 stylesheet.

## Demo walkthrough

1. Register with a full name, student number, valid email, and a password of 12-128 characters. This still creates only a local preview session; the student number and password are not saved or submitted to the backend.
2. Create a post with a title, category, location, date, and description; optionally upload a JPG/PNG/WebP image under 1 MB.
3. Open the post from the homepage, browse page, or My posts.
4. Edit the post, mark it recovered, reopen it, or delete it as its author.
5. Refresh to verify browser-local persistence. Log out to view the signed-out experience.

## Data and authentication

These routes use `lib/store.tsx` and `lib/data.ts`, not the NestJS API. Login does not verify passwords or email ownership; passwords are never stored. Owner checks are demo UI behavior, not server authorization. Contact buttons open `mailto:` links.

Items and session are stored in `campusfind-demo-items-v1` and `campusfind-demo-session-v1` in localStorage. Data is specific to this browser and origin. Clear these keys and reload to reset the demo. Browser storage limits apply, especially when saving images.

Real accounts, shared reports, durable image uploads, and authorization require backend integration.

## Backend tasks screen

`/tasks` uses the NestJS email/token API and is separate from the listing demo session. Set up PostgreSQL and create an account using `POST /auth/register` as documented in `../backend/API.md`. Passwords for this API must be 12-128 characters. The API defaults to `http://localhost:3001`; set `NEXT_PUBLIC_API_URL` in `.env.local` to override it before starting/building Next.js.
