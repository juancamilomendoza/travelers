-- Pa Donde Vamos: run this once in Supabase > SQL Editor.
-- Only the Netlify function (service role key) reads and writes these tables.
-- Row Level Security is on with no policies, so the public anon key cannot read the leads.
-- name/email/whatsapp are optional: a row without them is an anonymous search (no consent needed).

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  mode text not null check (mode in ('suggest', 'known')),
  lang text not null,
  name text,
  email text,
  whatsapp text,
  consent_version text,
  consent_at timestamptz,
  currency text not null check (currency in ('COP', 'USD', 'EUR')),
  budget_per_person numeric not null,
  budget_per_person_cop numeric,
  travelers int not null,
  plan_type text not null,
  start_date date,
  end_date date,
  days int not null,
  origin text,
  has_passport boolean,
  visas text[],
  destination text,
  has_flights boolean,
  has_lodging boolean,
  result jsonb,
  wants_contact boolean not null default false
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_mode_idx on public.leads (mode);

create table if not exists public.plan_cache (
  key text primary key,
  mode text not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;
alter table public.plan_cache enable row level security;

-- Added 2026-11-12: travelers from any country.
alter table public.leads add column if not exists nationality text;

-- Added 2026-11-12: groups with children and several nationalities; budget is the group total.
alter table public.leads
  add column if not exists adults int,
  add column if not exists children_ages int[],
  add column if not exists nationalities text[],
  add column if not exists passport_status text check (passport_status in ('all', 'some', 'none')),
  add column if not exists budget_total numeric,
  add column if not exists budget_total_cop numeric;

-- Added 2026-11-12: "Un plan en mi ciudad" (mode local).
alter table public.leads drop constraint if exists leads_mode_check;
alter table public.leads add constraint leads_mode_check check (mode in ('suggest', 'known', 'local'));
alter table public.leads alter column plan_type drop not null;
alter table public.leads
  add column if not exists interests text[],
  add column if not exists local_when text check (local_when in ('today', 'weekend', 'date'));
