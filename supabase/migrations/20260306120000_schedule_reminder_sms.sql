-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the SMS reminder edge function to run daily at 14:00 UTC (9:00 AM EST)
-- INSTRUCTIONS FOR PRODUCTION:
-- 1. Replace <YOUR_PROJECT_REF> with your Supabase Project Reference ID
-- 2. Replace <YOUR_ANON_KEY> with your Supabase Anon Key (or Service Role Key)
-- 
-- To unschedule: SELECT cron.unschedule('invoke-send-reminder-sms');

SELECT cron.schedule(
  'invoke-send-reminder-sms',
  '0 14 * * *', -- Runs at 14:00 UTC every day
  $$
    SELECT net.http_post(
      url:='https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-reminder-sms',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_ANON_KEY>"}'::jsonb
    );
  $$
);
