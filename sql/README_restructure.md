# Database Restructuring: Tasks and Home_Tasks Tables

## Overview
This restructuring separates template tasks from active home-specific tasks as requested.

## Table Structure Changes

### TASKS Table (Template Tasks Only)
**Purpose**: Store template tasks that serve as blueprints for home-specific tasks.

**Fields**:
- `id` - Unique identifier
- `title` - Task title
- `description` - Task description (optional)
- `category` - Task category
- `subcategory` - Task subcategory (optional)
- `created_at` - Creation timestamp

**Removed Fields**: All home-specific and status fields have been removed:
- No `status` field (templates don't have status)
- No `home_id` field (templates are not home-specific)
- No completion fields
- No assignment fields
- No scheduling fields
- No priority fields

### HOME_TASKS Table (Active Tasks)
**Purpose**: Store active tasks assigned to specific homes with all execution details.

**Fields**: Contains all the fields that were removed from tasks table:
- `home_id` - Which home this task belongs to
- `task_id` - Reference to template task (optional for custom tasks)
- `title` - Task title (copied from template or customized)
- `status` - Current task status
- `is_active` - Whether task is active for the home
- All completion, assignment, scheduling, and priority fields
- All home-specific customization fields

## Seeded Template Tasks

The script seeds the following template categories:

### Home Maintenance (16 templates)
- Filters, Light Bulbs, Irrigation, Window Cleaning
- Furniture Cleaning, Rug Cleaning, Exterior Home Wash
- Painting Touch-ups, Gutters, Chimney/Fireplace Service
- Deck/Patio Reseal, Tree & Shrub Trimming, Grass Cutting
- HVAC Service, Sump Pump Check, Security Systems & Cameras

### Health + Safety (4 templates)
- Smoke/CO2 Detectors, Fire Extinguisher Inspection
- Emergency Kit Review, Medication Clean Out

### Deep Cleaning (12 templates)
- Fridge Deep Clean, Dryer Vents Clean, Trash Cans Clean
- Sheets Refresh, Baseboards and Door Frames Clean
- Light Fixtures + Ceiling Fans Clean, Vents + Air Returns Clean
- Shower Heads Descale, Garbage Disposal Clean
- Washer + Dryer Deep Clean, Grout Clean, Garage Clean-out

### Repairs (2 templates)
- Repairs (Assessment), Repair - Photo + Cost + Notes

## Usage Pattern

1. **Template Selection**: Users browse template tasks from the `tasks` table
2. **Task Activation**: When a user activates a template for their home, a new record is created in `home_tasks` with:
   - `task_id` pointing to the template
   - `home_id` set to their home
   - `title` copied from template
   - All other fields set to defaults or user preferences
3. **Task Management**: All task execution happens in `home_tasks` table
4. **Custom Tasks**: Users can create custom tasks directly in `home_tasks` without a `task_id`

## Security Model

### TASKS Table (Templates)
- **No RLS**: Templates are global and accessible to all users
- **No family_account_id**: Templates don't belong to specific families
- **Public Access**: All users can view and browse template tasks

### HOME_TASKS Table (Active Tasks)
- **RLS Enabled**: Family-level security enforced
- **Family-based Access**: Users can only access tasks for homes in their family account
- **Secure Operations**: All CRUD operations are family-scoped

## Benefits

- **Clean Separation**: Templates vs. active tasks are clearly separated
- **Performance**: Smaller template table for faster browsing
- **Flexibility**: Home-specific customization without affecting templates
- **Scalability**: Templates can be shared across all homes
- **Data Integrity**: No confusion between template and active task data
- **Security**: Proper family-level access control on active tasks

## Migration Notes

- All existing data is backed up to `*_backup` tables
- Existing data is cleared and restructured
- Template tasks are reseeded with the standard set
- All indexes and constraints are recreated for optimal performance
