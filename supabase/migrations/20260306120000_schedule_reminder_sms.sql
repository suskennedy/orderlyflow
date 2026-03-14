-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing job if it exists (idempotent)
SELECT cron.unschedule('invoke-send-reminder-sms')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'invoke-send-reminder-sms'
);

-- Schedule the SMS reminder edge function to run daily at 14:00 UTC (9:00 AM EST)
-- To unschedule: SELECT cron.unschedule('invoke-send-reminder-sms');

SELECT cron.schedule(
  'invoke-send-reminder-sms',
  '0 14 * * *', -- Runs at 14:00 UTC every day
  $$
    SELECT net.http_post(
      url:='https://bdseoponzbedfpkpacqd.supabase.co/functions/v1/send-reminder-sms',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkc2VvcG9uemJlZGZwa3BhY3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTMzNDEsImV4cCI6MjA2NTIyOTM0MX0.LWHvhHhq6zxqGOiUDoSAmSq1BocHFrJV0lqVCGUekC8"}'::jsonb,
      body:='{}'::jsonb
    );
  $$
);
