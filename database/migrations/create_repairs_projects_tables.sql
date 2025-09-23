-- Create repairs table
CREATE TABLE IF NOT EXISTS repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- Emergency, Routine, Cosmetic, etc.
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  assigned_vendor_id UUID REFERENCES vendors(id),
  assigned_user_id UUID REFERENCES user_profiles(id),
  due_date DATE,
  completed_date DATE,
  notes TEXT,
  photos TEXT[], -- Array of photo URLs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  family_account_id UUID REFERENCES family_accounts(id)
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- Renovation, Addition, Remodel, etc.
  status VARCHAR(20) DEFAULT 'planning', -- planning, in_progress, completed, on_hold
  priority VARCHAR(20) DEFAULT 'medium',
  estimated_budget DECIMAL(10,2),
  actual_budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  completion_date DATE,
  assigned_vendor_id UUID REFERENCES vendors(id),
  assigned_user_id UUID REFERENCES user_profiles(id),
  notes TEXT,
  photos TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  family_account_id UUID REFERENCES family_accounts(id)
);

-- Add description field to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS frequency VARCHAR(50);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';

-- Add repair_id and project_id fields to calendar_events table
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_repairs_home_id ON repairs(home_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
CREATE INDEX IF NOT EXISTS idx_projects_home_id ON projects(home_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_repairs_created_by ON repairs(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_repair_id ON calendar_events(repair_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project_id ON calendar_events(project_id);

-- Enable Row Level Security
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for repairs
CREATE POLICY "Users can view repairs for their family homes" ON repairs
  FOR SELECT USING (
    family_account_id IN (
      SELECT family_account_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert repairs for their family homes" ON repairs
  FOR INSERT WITH CHECK (
    family_account_id IN (
      SELECT family_account_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update repairs for their family homes" ON repairs
  FOR UPDATE USING (
    family_account_id IN (
      SELECT family_account_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete repairs for their family homes" ON repairs
  FOR DELETE USING (
    family_account_id IN (
      SELECT family_account_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

-- Create RLS policies for projects
CREATE POLICY "Users can view projects for their family homes" ON projects
  FOR SELECT USING (
    family_account_id IN (
      SELECT family_account_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert projects for their family homes" ON projects
  FOR INSERT WITH CHECK (
    family_account_id IN (
      SELECT family_account_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update projects for their family homes" ON projects
  FOR UPDATE USING (
    family_account_id IN (
      SELECT family_account_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete projects for their family homes" ON projects
  FOR DELETE USING (
    family_account_id IN (
      SELECT family_account_id FROM user_profiles 
      WHERE id = auth.uid()
    )
  );
