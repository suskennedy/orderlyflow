-- 1. Backfill Data to ensure all nested items have a home_id
UPDATE projects 
SET home_id = (SELECT id FROM homes WHERE homes.user_id = projects.created_by LIMIT 1) 
WHERE home_id IS NULL AND created_by IS NOT NULL;

UPDATE repairs 
SET home_id = (SELECT id FROM homes WHERE homes.user_id = repairs.created_by LIMIT 1) 
WHERE home_id IS NULL AND created_by IS NOT NULL;

UPDATE repairs 
SET home_id = (SELECT id FROM homes WHERE homes.user_id = repairs.created_by LIMIT 1) 
WHERE home_id IS NULL AND created_by IS NOT NULL;

UPDATE home_tasks 
SET home_id = (SELECT id FROM homes WHERE homes.user_id = home_tasks.created_by LIMIT 1) 
WHERE home_id IS NULL AND created_by IS NOT NULL;

-- 2. Drop deprecated ownership columns
ALTER TABLE repairs DROP COLUMN IF EXISTS created_by CASCADE;

ALTER TABLE projects DROP COLUMN IF EXISTS created_by CASCADE;
-- Also dropping assigned_vendor_id from projects if the migration 20251026085529_deprecate_assigned_vendor_id_for_projects.sql didn't

ALTER TABLE home_tasks DROP COLUMN IF EXISTS created_by CASCADE;
-- Also dropped user_id if it existed on home_tasks, but from types it doesn't

-- Drop family sharing tables. This will drop the foreign key constraints but not the columns.
DROP TABLE IF EXISTS family_invitations CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS family_accounts CASCADE;

-- Drop the family_account_id columns from all tables
ALTER TABLE appliances DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE cabinets DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE calendar_events DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE filters DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE home_tasks DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE homes DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE infrastructure_locations DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE light_fixtures DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE materials DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE paint_colors DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE projects DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE repairs DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE tasks DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE tiles DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE user_settings DROP COLUMN IF EXISTS family_account_id CASCADE;
ALTER TABLE vendors DROP COLUMN IF EXISTS family_account_id CASCADE;

-- 3. Drop all existing RLS Policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT pol.polname, class.relname 
              FROM pg_policy pol 
              JOIN pg_class class ON class.oid = pol.polrelid 
              JOIN pg_namespace ns ON ns.oid = class.relnamespace 
              WHERE ns.nspname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.polname, r.relname);
    END LOOP;
END $$;

-- 4. Enable RLS and Create New Standardized Policies

-- DIRECT OWNERSHIP TABLES (owned by user_id)
ALTER TABLE homes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage own homes" ON homes FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage own vendors" ON vendors FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage own settings" ON user_settings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON tasks FOR SELECT USING (true);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage own calendar events" ON calendar_events FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage own profile" ON user_profiles FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- NESTED OWNERSHIP TABLES (owned by home_id -> homes.user_id)
ALTER TABLE appliances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage appliances via home" ON appliances FOR ALL USING (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid()));

ALTER TABLE cabinets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage cabinets via home" ON cabinets FOR ALL USING (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid()));

ALTER TABLE filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage filters via home" ON filters FOR ALL USING (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid()));

ALTER TABLE home_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage home tasks via home" ON home_tasks FOR ALL USING (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid()));

ALTER TABLE infrastructure_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage infrastructure locations via home" ON infrastructure_locations FOR ALL USING (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid()));

ALTER TABLE light_fixtures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage light fixtures via home" ON light_fixtures FOR ALL USING (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid()));

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage materials via home" ON materials FOR ALL USING (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid()));

ALTER TABLE paint_colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage paint colors via home" ON paint_colors FOR ALL USING (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid()));

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage projects via home" ON projects FOR ALL USING (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid()));

ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage repairs via home" ON repairs FOR ALL USING (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid()));

ALTER TABLE tiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage tiles via home" ON tiles FOR ALL USING (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid()));

ALTER TABLE home_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage home calendar events via home" ON home_calendar_events FOR ALL USING (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM homes WHERE homes.id = home_id AND homes.user_id = auth.uid()));
