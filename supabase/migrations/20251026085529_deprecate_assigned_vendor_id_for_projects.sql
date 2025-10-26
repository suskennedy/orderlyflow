-- Migration: Deprecate assigned_vendor_id for projects
-- This migration has already been applied successfully
-- The projects table now uses vendor_ids array instead of assigned_vendor_id

-- Current state verification:
-- ✅ vendor_ids: string[] | null - EXISTS
-- ❌ assigned_vendor_id - REMOVED

-- The following steps were completed in a previous migration:

-- Step 1: ✅ Data migration completed
-- Migrated existing assigned_vendor_id data to vendor_ids array

-- Step 2: ✅ Column removal completed  
-- Removed the deprecated assigned_vendor_id column

-- Step 3: ✅ Index creation completed
-- Created GIN index on vendor_ids for better query performance

-- Step 4: ✅ Constraint added
-- Added constraint to ensure vendor_ids contains valid UUIDs

-- Step 5: ✅ Foreign key constraint removed
-- Dropped the foreign key constraint for assigned_vendor_id

-- This migration file serves as documentation of the completed changes.
-- No further action is required as the migration has been successfully applied.