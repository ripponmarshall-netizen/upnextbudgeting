create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

create or replace function public.touch_upnext_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = coalesce(new.updated_at, now());
  return new;
end;
$$;

create table if not exists public.upnext_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  name text not null,
  category text not null,
  amount numeric(14, 2) not null default 0,
  due date not null,
  paid boolean not null default false,
  repeat text not null default 'none',
  property_tax_plan text not null default 'full',
  series_key text,
  archived boolean not null default false,
  archived_at timestamptz,
  completed_at timestamptz,
  activity jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, client_id)
);

create table if not exists public.upnext_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  amount numeric(14, 2) not null default 0,
  category text not null,
  merchant text not null,
  note text not null default '',
  expense_date date not null,
  payment_source text not null default 'Cash',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, client_id)
);

create table if not exists public.upnext_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#5cae9f',
  planned numeric(14, 2) not null default 0,
  assigned numeric(14, 2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, name)
);

create table if not exists public.upnext_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reminder_days integer not null default 3,
  theme text not null default 'light',
  cashflow jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.upnext_web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  subscription jsonb not null,
  enabled boolean not null default true,
  user_agent text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, endpoint)
);

create table if not exists public.upnext_notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.upnext_web_push_subscriptions(id) on delete set null,
  notification_date date not null default current_date,
  summary text not null,
  bill_count integer not null default 0,
  amount numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, subscription_id, notification_date)
);

alter table public.upnext_bills enable row level security;
alter table public.upnext_expenses enable row level security;
alter table public.upnext_categories enable row level security;
alter table public.upnext_settings enable row level security;
alter table public.upnext_web_push_subscriptions enable row level security;
alter table public.upnext_notification_log enable row level security;

drop policy if exists "Users can select own upnext bills" on public.upnext_bills;
drop policy if exists "Users can insert own upnext bills" on public.upnext_bills;
drop policy if exists "Users can update own upnext bills" on public.upnext_bills;
drop policy if exists "Users can delete own upnext bills" on public.upnext_bills;
create policy "Users can select own upnext bills" on public.upnext_bills for select using (auth.uid() = user_id);
create policy "Users can insert own upnext bills" on public.upnext_bills for insert with check (auth.uid() = user_id);
create policy "Users can update own upnext bills" on public.upnext_bills for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own upnext bills" on public.upnext_bills for delete using (auth.uid() = user_id);

drop policy if exists "Users can select own upnext expenses" on public.upnext_expenses;
drop policy if exists "Users can insert own upnext expenses" on public.upnext_expenses;
drop policy if exists "Users can update own upnext expenses" on public.upnext_expenses;
drop policy if exists "Users can delete own upnext expenses" on public.upnext_expenses;
create policy "Users can select own upnext expenses" on public.upnext_expenses for select using (auth.uid() = user_id);
create policy "Users can insert own upnext expenses" on public.upnext_expenses for insert with check (auth.uid() = user_id);
create policy "Users can update own upnext expenses" on public.upnext_expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own upnext expenses" on public.upnext_expenses for delete using (auth.uid() = user_id);

drop policy if exists "Users can select own upnext categories" on public.upnext_categories;
drop policy if exists "Users can insert own upnext categories" on public.upnext_categories;
drop policy if exists "Users can update own upnext categories" on public.upnext_categories;
drop policy if exists "Users can delete own upnext categories" on public.upnext_categories;
create policy "Users can select own upnext categories" on public.upnext_categories for select using (auth.uid() = user_id);
create policy "Users can insert own upnext categories" on public.upnext_categories for insert with check (auth.uid() = user_id);
create policy "Users can update own upnext categories" on public.upnext_categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own upnext categories" on public.upnext_categories for delete using (auth.uid() = user_id);

drop policy if exists "Users can select own upnext settings" on public.upnext_settings;
drop policy if exists "Users can insert own upnext settings" on public.upnext_settings;
drop policy if exists "Users can update own upnext settings" on public.upnext_settings;
create policy "Users can select own upnext settings" on public.upnext_settings for select using (auth.uid() = user_id);
create policy "Users can insert own upnext settings" on public.upnext_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own upnext settings" on public.upnext_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can select own upnext push subscriptions" on public.upnext_web_push_subscriptions;
drop policy if exists "Users can insert own upnext push subscriptions" on public.upnext_web_push_subscriptions;
drop policy if exists "Users can update own upnext push subscriptions" on public.upnext_web_push_subscriptions;
drop policy if exists "Users can delete own upnext push subscriptions" on public.upnext_web_push_subscriptions;
create policy "Users can select own upnext push subscriptions" on public.upnext_web_push_subscriptions for select using (auth.uid() = user_id);
create policy "Users can insert own upnext push subscriptions" on public.upnext_web_push_subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can update own upnext push subscriptions" on public.upnext_web_push_subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own upnext push subscriptions" on public.upnext_web_push_subscriptions for delete using (auth.uid() = user_id);

drop policy if exists "Users can select own upnext notification log" on public.upnext_notification_log;
create policy "Users can select own upnext notification log" on public.upnext_notification_log for select using (auth.uid() = user_id);

drop trigger if exists touch_upnext_bills_updated_at on public.upnext_bills;
create trigger touch_upnext_bills_updated_at before insert or update on public.upnext_bills
for each row execute function public.touch_upnext_updated_at();

drop trigger if exists touch_upnext_expenses_updated_at on public.upnext_expenses;
create trigger touch_upnext_expenses_updated_at before insert or update on public.upnext_expenses
for each row execute function public.touch_upnext_updated_at();

drop trigger if exists touch_upnext_categories_updated_at on public.upnext_categories;
create trigger touch_upnext_categories_updated_at before insert or update on public.upnext_categories
for each row execute function public.touch_upnext_updated_at();

drop trigger if exists touch_upnext_settings_updated_at on public.upnext_settings;
create trigger touch_upnext_settings_updated_at before insert or update on public.upnext_settings
for each row execute function public.touch_upnext_updated_at();

drop trigger if exists touch_upnext_web_push_subscriptions_updated_at on public.upnext_web_push_subscriptions;
create trigger touch_upnext_web_push_subscriptions_updated_at before insert or update on public.upnext_web_push_subscriptions
for each row execute function public.touch_upnext_updated_at();

do $$
declare
  job text;
begin
  foreach job in array array[
    'upnextbudgeting-send-push-6am-jamaica',
    'nextupbudgeting_queue_daily_summaries',
    'nextupbudgeting_push_worker',
    'upnextbudgeting_send_upnext_notifications'
  ]
  loop
    begin
      perform cron.unschedule(job);
    exception
      when others then null;
    end;
  end loop;
end;
$$;

select cron.schedule(
  'upnextbudgeting_send_upnext_notifications',
  '0 11 * * *',
  $$
  select net.http_post(
    url := 'https://nmrtjlattlurektpkzzi.supabase.co/functions/v1/send-upnext-notifications',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"source":"pg_cron"}'::jsonb
  );
  $$
);
