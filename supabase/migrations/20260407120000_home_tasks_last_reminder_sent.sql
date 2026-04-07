-- SMS reminder edge function (send-reminder-sms) selects and updates this column.
ALTER TABLE public.home_tasks
  ADD COLUMN IF NOT EXISTS last_reminder_sent timestamp with time zone;

COMMENT ON COLUMN public.home_tasks.last_reminder_sent IS
  'Timestamp of the last due-date SMS reminder sent via send-reminder-sms.';
