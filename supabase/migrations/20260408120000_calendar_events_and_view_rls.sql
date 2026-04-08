-- Calendar RLS: align with home-scoped data (homes.user_id) and fix the
-- home_calendar_events_with_tasks view so it does not deny all rows when RLS
-- was enabled on the view without policies.

-- -----------------------------------------------------------------------------
-- 1) calendar_events — drop legacy "own row only" policy if present
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Manage own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can view their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can insert their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can view calendar events in their family account" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can insert calendar events in their family account" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update calendar events in their family account" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete calendar events in their family account" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_access" ON public.calendar_events;

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- One policy: owners see/manage rows tied to their auth user OR to a home they own,
-- or via linked home_task / project / repair on that home.
CREATE POLICY "calendar_events_access"
ON public.calendar_events
FOR ALL
TO authenticated
USING (
  (
    user_id IS NOT NULL
    AND user_id = (SELECT auth.uid())
  )
  OR (
    home_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.homes h
      WHERE h.id = calendar_events.home_id
        AND h.user_id = (SELECT auth.uid())
    )
  )
  OR (
    home_task_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.home_tasks ht
      INNER JOIN public.homes h ON h.id = ht.home_id
      WHERE ht.id = calendar_events.home_task_id
        AND h.user_id = (SELECT auth.uid())
    )
  )
  OR (
    project_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      INNER JOIN public.homes h ON h.id = p.home_id
      WHERE p.id = calendar_events.project_id
        AND h.user_id = (SELECT auth.uid())
    )
  )
  OR (
    repair_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.repairs r
      INNER JOIN public.homes h ON h.id = r.home_id
      WHERE r.id = calendar_events.repair_id
        AND h.user_id = (SELECT auth.uid())
    )
  )
)
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
  AND user_id = (SELECT auth.uid())
  AND (
    home_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.homes h
      WHERE h.id = home_id AND h.user_id = (SELECT auth.uid())
    )
  )
  AND (
    home_task_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.home_tasks ht
      INNER JOIN public.homes h ON h.id = ht.home_id
      WHERE ht.id = home_task_id AND h.user_id = (SELECT auth.uid())
    )
  )
  AND (
    project_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.projects p
      INNER JOIN public.homes h ON h.id = p.home_id
      WHERE p.id = project_id AND h.user_id = (SELECT auth.uid())
    )
  )
  AND (
    repair_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.repairs r
      INNER JOIN public.homes h ON h.id = r.home_id
      WHERE r.id = repair_id AND h.user_id = (SELECT auth.uid())
    )
  )
);

-- -----------------------------------------------------------------------------
-- 2) home_calendar_events (mapping table) — refresh policy name if needed
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Manage home calendar events via home" ON public.home_calendar_events;

ALTER TABLE public.home_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "home_calendar_events_via_owned_home"
ON public.home_calendar_events
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.homes h
    WHERE h.id = home_calendar_events.home_id
      AND h.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.homes h
    WHERE h.id = home_calendar_events.home_id
      AND h.user_id = (SELECT auth.uid())
  )
);

-- -----------------------------------------------------------------------------
-- 3) View home_calendar_events_with_tasks
--    If RLS was enabled on the VIEW with no policies, every SELECT returns 0 rows
--    or errors. Prefer security_invoker (PG15+) so calendar_events RLS applies;
--    otherwise turn off view-level RLS so the base table policies govern access.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  ALTER VIEW public.home_calendar_events_with_tasks SET (security_invoker = true);
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'home_calendar_events_with_tasks: could not SET security_invoker: %', SQLERRM;
END $$;

DO $$
BEGIN
  ALTER VIEW public.home_calendar_events_with_tasks DISABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'home_calendar_events_with_tasks: could not DISABLE RLS on view: %', SQLERRM;
END $$;

GRANT SELECT ON public.home_calendar_events_with_tasks TO authenticated;
