-- Vencimiento del plan premium (es_premium ya existe desde 0001_profiles.sql)
alter table public.profiles
  add column if not exists premium_hasta timestamptz;
