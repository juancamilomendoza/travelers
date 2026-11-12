-- Run once in Supabase > SQL Editor (added 2026-11-12): stores the traveler's nationality.
alter table public.leads add column if not exists nationality text;
