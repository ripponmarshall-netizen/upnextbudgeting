create extension if not exists pgcrypto;

create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  subscription jsonb not null,
  enabled boolean not null default true,
  user_label text not null default 'marshall',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.bill_notification_snapshots (
  subscription_id uuid not null references public.notification_subscriptions(id) on delete cascade,
  bill_id text not null,
  name text not null,
  category text not null,
  amount numeric not null default 0,
  due date not null,
  paid boolean not null default false,
  repeat text not null default 'none',
  reminder_days integer not null default 5,
  updated_at timestamptz not null default now(),
  primary key (subscription_id, bill_id)
);

create table if not exists public.notification_send_log (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.notification_subscriptions(id) on delete cascade,
  send_date date not null,
  title text not null,
  body text not null,
  bill_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (subscription_id, send_date)
);

alter table public.notification_subscriptions enable row level security;
alter table public.bill_notification_snapshots enable row level security;
alter table public.notification_send_log enable row level security;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notification_subscriptions_touch on public.notification_subscriptions;
create trigger notification_subscriptions_touch
before update on public.notification_subscriptions
for each row execute function public.touch_updated_at();

-- Supabase Cron setup, after deploying functions and setting secrets:
-- Enable the Cron integration, then schedule the sender for 6:00 AM Jamaica time.
-- Replace <PROJECT_REF> if you prefer SQL setup instead of Dashboard setup.
--
-- select cron.schedule(
--   'upnextbudgeting-due-notifications-6am-jamaica',
--   '0 11 * * *',
--   $$
--   select net.http_post(
--     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-due-notifications',
--     headers := '{"Content-Type":"application/json","Authorization":"Bearer <SUPABASE_ANON_KEY>"}'::jsonb,
--     body := '{"source":"cron"}'::jsonb
--   );
--   $$
-- );
