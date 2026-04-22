-- Migration: Fix pg_cron job to correctly call the send-due-notifications Edge Function
--
-- Problem: The previous cron job called generate_due_soon_notifications() which
-- inserted rows into public.notifications, but nothing read that table to deliver
-- Web Push. The send-due-notifications Edge Function (the actual push sender) was
-- never scheduled.
--
-- Fix:
--   1. Remove the old broken cron job.
--   2. Schedule send-due-notifications at 6:00 AM Jamaica time (11:00 UTC).
--   3. The function uses x-cron-secret header auth (JWT verify is disabled on it).
--
-- PREREQUISITE before this runs:
--   a. Set the CRON_SECRET Edge Function secret in the Dashboard.
--   b. Run: ALTER DATABASE postgres SET app.cron_secret = '<your-secret>';
--      so that current_setting('app.cron_secret', true) below resolves correctly.

SELECT cron.unschedule('upnextbudgeting-due-soon-generate-jamaica-6am');

SELECT cron.schedule(
  'upnextbudgeting-send-push-6am-jamaica',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nmrtjlattlurektpkzzi.supabase.co/functions/v1/send-due-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := '{"source":"cron"}'::jsonb
  );
  $$
);
