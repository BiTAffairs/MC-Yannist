-- Run this in the Supabase SQL editor for your project.

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  contact text,
  service text,
  event_date date not null,
  venue text,
  amount_charged numeric not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  source text not null default 'client' check (source in ('client','vendor')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  amount numeric not null,
  method text default 'cash',
  note text,
  paid_on date not null default current_date,
  created_at timestamptz not null default now()
);

alter table bookings enable row level security;
alter table payments enable row level security;

-- Public: anyone can see date + status only, via a view (no client details, no amounts).
create or replace view public_availability as
  select event_date, status
  from bookings
  where status in ('pending', 'approved');

grant select on public_availability to anon;

-- Public: anyone can INSERT a booking request (status forced to pending client-side,
-- but we double-enforce here for anonymous inserts).
create policy "anyone can request a booking"
  on bookings for insert
  to anon
  with check (status = 'pending' and source = 'client');

-- Vendor (authenticated): full access.
create policy "vendor full access to bookings"
  on bookings for all
  to authenticated
  using (true)
  with check (true);

create policy "vendor full access to payments"
  on payments for all
  to authenticated
  using (true)
  with check (true);

-- No anon access to the bookings table directly (they use the view instead),
-- and no anon access to payments at all.
