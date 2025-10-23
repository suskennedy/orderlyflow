-- Update projects table to match new form requirements

-- Add new columns (non-destructive)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_type VARCHAR(50), -- renovation | remodel | landscaping | decorating | organization | other
  ADD COLUMN IF NOT EXISTS target_completion_date DATE,
  ADD COLUMN IF NOT EXISTS photos_inspiration TEXT[], -- array of URLs
  ADD COLUMN IF NOT EXISTS location_in_home VARCHAR(255),
  ADD COLUMN IF NOT EXISTS vendor_ids TEXT[], -- array of vendor ids
  ADD COLUMN IF NOT EXISTS assigned_user_ids TEXT[], -- array of user ids
  ADD COLUMN IF NOT EXISTS current_spend DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS final_cost DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS subtasks JSONB; -- [{ title, is_done, due_date }]

-- Ensure existing analogous fields exist (start_date, description, status, estimated_budget already present)

-- Optional: Normalize status values to new allowed set by comment (use CHECK later if desired)
COMMENT ON COLUMN projects.project_type IS 'renovation | remodel | landscaping | decorating | organization | other';
COMMENT ON COLUMN projects.status IS 'not_started | in_progress | on_hold | completed';
COMMENT ON COLUMN projects.photos_inspiration IS 'Array of inspiration photo/video URLs stored in repair-media/projects/';
COMMENT ON COLUMN projects.vendor_ids IS 'Array of vendor ids associated with this project';
COMMENT ON COLUMN projects.assigned_user_ids IS 'Array of user ids assigned to this project';
COMMENT ON COLUMN projects.subtasks IS 'JSONB array of objects: { title: string, is_done: boolean, due_date?: date }';

-- Indexes for filters
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);

