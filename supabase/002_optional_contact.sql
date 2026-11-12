-- Run once in Supabase > SQL Editor if you already ran schema.sql before 2026-11-12 (3 PM).
-- Makes name, email and WhatsApp optional, so anonymous searches can be saved too.
alter table public.leads alter column name drop not null;
alter table public.leads alter column email drop not null;
alter table public.leads alter column whatsapp drop not null;
alter table public.leads alter column consent_version drop not null;
alter table public.leads alter column consent_at drop not null;
