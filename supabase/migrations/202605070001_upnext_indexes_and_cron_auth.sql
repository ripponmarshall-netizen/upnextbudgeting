-- Indexes for hot Edge Function queries.
create index if not exists upnext_bills_user_due_due_pending_idx
  on public.upnext_bills (user_id, due)
  where paid = false and archived = false and deleted_at is null;

create index if not exists upnext_bills_user_id_idx
  on public.upnext_bills (user_id);

create index if not exists upnext_expenses_user_id_idx
  on public.upnext_expenses (user_id);

create index if not exists upnext_categories_user_id_idx
  on public.upnext_categories (user_id);

create index if not exists upnext_web_push_subscriptions_user_id_active_idx
  on public.upnext_web_push_subscriptions (user_id)
  where enabled = true and deleted_at is null;

-- Cron call to the Edge Function previously omitted Authorization, so
-- Supabase JWT verification rejected every invocation. Wrap the call in
-- a security-definer function that reads Vault at runtime so neither the
-- service-role key nor the project URL is hard-coded in pg_cron metadata.
--
-- Operator setup (one-time, NOT in migration to avoid leaking secrets):
--   select vault.create_secret('https://<project>.supabase.co/functions/v1/send-upnext-notifications', 'upnext_functions_url');
--   select vault.create_secret('<service-role-key>', 'upnext_service_role_key');

create or replace function public.upnext_send_due_notifications()
returns bigint
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  fn_url text;
  bearer text;
  request_id bigint;
begin
  select decrypted_secret into fn_url
    from vault.decrypted_secrets where name = 'upnext_functions_url';
  select decrypted_secret into bearer
    from vault.decrypted_secrets where name = 'upnext_service_role_key';

  if fn_url is null or bearer is null then
    raise exception
      'Missing vault secrets upnext_functions_url and/or upnext_service_role_key';
  end if;

  select net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || bearer
    ),
    body := jsonb_build_object('source', 'pg_cron')
  ) into request_id;

  return request_id;
end;
$$;

revoke all on function public.upnext_send_due_notifications() from public;

do $$
begin
  perform cron.unschedule('upnextbudgeting_send_upnext_notifications');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'upnextbudgeting_send_upnext_notifications',
  '0 11 * * *',
  $$select public.upnext_send_due_notifications();$$
);
