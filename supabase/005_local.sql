-- 2026-11-12: "Un plan en mi ciudad" (mode 'local'): where the group is, what they want to do and when.
alter table public.leads drop constraint if exists leads_mode_check;
alter table public.leads add constraint leads_mode_check check (mode in ('suggest', 'known', 'local'));
alter table public.leads alter column plan_type drop not null;
alter table public.leads
  add column if not exists interests text[],
  add column if not exists local_when text check (local_when in ('today', 'weekend', 'date'));
