# MC Yannist Bookings

A single-vendor bookings and payments tracker.

- **Public page** (`/`) — clients see a calendar of open / requested / booked
  dates and can submit a booking request. No amounts or client details are
  ever shown publicly.
- **Dashboard** (`/admin`) — sign in to approve/reject requests, add manual
  bookings (phone/in-person), and log payments over time with a running
  balance per booking.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run everything in `supabase-schema.sql`. This creates
   the `bookings` and `payments` tables, a `public_availability` view (the
   only thing anonymous visitors can read), and row-level security policies.
3. Go to **Authentication → Users** and manually create one user for
   yourself (email + password) — this is your vendor login. Public sign-up
   is intentionally not exposed anywhere in the app.
4. Go to **Project Settings → API** and copy your **Project URL** and
   **anon public key**.

## 2. Configure the app

```bash
cp .env.example .env
```

Edit `.env` and paste in your Supabase URL and anon key.

## 3. Install and run

```bash
npm install
npm run dev
```

Visit the printed local URL. `/` is the public calendar, `/admin/login` is
where you sign in.

## 4. Deploy

Push this project to GitHub and import it on [Vercel](https://vercel.com).
Add the same two environment variables (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`) in the Vercel project settings. Works on both
desktop and mobile browsers — no separate mobile app needed. You can later
add a `manifest.json` + service worker to make it installable to a phone's
home screen (PWA), if you want it to feel more like a native app.

## How data is protected

- Anonymous visitors can only `SELECT` from the `public_availability` view
  (date + status, nothing else) and `INSERT` a booking request. They cannot
  read client names, contact info, or any amounts.
- Only an authenticated (signed-in) user — you — can read/write the full
  `bookings` table and the `payments` table.

## Status meanings

| Status | Meaning |
|---|---|
| `pending` | Client requested this date; awaiting your approval |
| `approved` | Confirmed booking — blocks the date publicly |
| `rejected` | You declined the request |
| `cancelled` | Was approved, later cancelled |
