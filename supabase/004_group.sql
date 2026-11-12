-- 2026-11-12: groups with children and several nationalities; budget is now the group total.
alter table public.leads
  add column if not exists adults int,
  add column if not exists children_ages int[],
  add column if not exists nationalities text[],
  add column if not exists passport_status text check (passport_status in ('all', 'some', 'none')),
  add column if not exists budget_total numeric,
  add column if not exists budget_total_cop numeric;
