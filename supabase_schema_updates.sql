-- Update appliances table to include room and purchased store
ALTER TABLE appliances ADD COLUMN IF NOT EXISTS room TEXT;
ALTER TABLE appliances ADD COLUMN IF NOT EXISTS purchased_store TEXT;

-- Update filters table to include room
ALTER TABLE filters ADD COLUMN IF NOT EXISTS room TEXT;

-- Create materials table if it doesn't exist (based on your schema, it seems to be missing)
CREATE TABLE IF NOT EXISTS materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  room TEXT,
  brand TEXT,
  source TEXT,
  purchase_date TEXT,
  notes TEXT,
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update paint_colors table to include room under name
-- The table already has room field, but let's ensure it's properly structured

-- Create warranties table if it doesn't exist
CREATE TABLE IF NOT EXISTS warranties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  room TEXT,
  warranty_start_date TEXT,
  warranty_end_date TEXT,
  provider TEXT,
  notes TEXT,
  home_id UUID REFERENCES homes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for materials and warranties
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;

-- Materials policies
CREATE POLICY "Users can view their own materials" ON materials
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM homes WHERE id = materials.home_id));

CREATE POLICY "Users can insert their own materials" ON materials
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM homes WHERE id = materials.home_id));

CREATE POLICY "Users can update their own materials" ON materials
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM homes WHERE id = materials.home_id));

CREATE POLICY "Users can delete their own materials" ON materials
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM homes WHERE id = materials.home_id));

-- Warranties policies
CREATE POLICY "Users can view their own warranties" ON warranties
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM homes WHERE id = warranties.home_id));

CREATE POLICY "Users can insert their own warranties" ON warranties
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM homes WHERE id = warranties.home_id));

CREATE POLICY "Users can update their own warranties" ON warranties
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM homes WHERE id = warranties.home_id));

CREATE POLICY "Users can delete their own warranties" ON warranties
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM homes WHERE id = warranties.home_id)); 

-- Remove purchase information from paint_colors
ALTER TABLE paint_colors DROP COLUMN IF EXISTS date_purchased;

-- Remove location and serial_number from appliances
ALTER TABLE appliances DROP COLUMN IF EXISTS location;
ALTER TABLE appliances DROP COLUMN IF EXISTS serial_number; 