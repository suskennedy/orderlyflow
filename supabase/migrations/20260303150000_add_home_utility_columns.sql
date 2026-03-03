-- Add utility/system columns to homes table
ALTER TABLE homes
  ADD COLUMN IF NOT EXISTS sewer_vs_septic TEXT,
  ADD COLUMN IF NOT EXISTS water_source TEXT,
  ADD COLUMN IF NOT EXISTS water_heater_location TEXT;