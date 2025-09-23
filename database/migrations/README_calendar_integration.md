# Calendar Integration for Repairs and Projects

This document explains the automatic calendar event creation for repairs and projects in the OrderlyFlow application.

## Overview

When repairs and projects are created with due dates or start dates, calendar events are automatically created in the database through triggers. This ensures that all scheduled work appears in the user's calendar without manual intervention.

## Database Structure

### Tables Involved

1. **repairs** - Contains repair information
2. **projects** - Contains project information  
3. **calendar_events** - Contains calendar events
4. **home_calendar_events** - Mapping table linking calendar events to homes

### Key Fields

- **repairs.due_date** - When set, triggers calendar event creation
- **projects.start_date** - When set, triggers calendar event creation
- **calendar_events.repair_id** - Links calendar event to repair
- **calendar_events.project_id** - Links calendar event to project
- **calendar_events.task_type** - Indicates type: 'repair' or 'project'

## Automatic Calendar Event Creation

### For Repairs

When a repair is created with a `due_date`:

1. **Database trigger** `create_calendar_event_for_repair()` automatically:
   - Creates a calendar event with title "🔧 [Repair Title]"
   - Sets start time to the due_date
   - Sets end time to 1 hour later
   - Links the event to the repair via `repair_id`
   - Creates mapping in `home_calendar_events` table

2. **Event details**:
   - Title: "🔧 [Repair Title]"
   - Description: Repair description or "Repair: [Title]"
   - Duration: 1 hour
   - Type: 'repair'

### For Projects

When a project is created with a `start_date`:

1. **Database trigger** `create_calendar_event_for_project()` automatically:
   - Creates a calendar event with title "🏗️ [Project Title]"
   - Sets start time to the start_date
   - Sets end time to end_date or 8 hours later
   - Links the event to the project via `project_id`
   - Creates mapping in `home_calendar_events` table

2. **Event details**:
   - Title: "🏗️ [Project Title]"
   - Description: Project description or "Project: [Title]"
   - Duration: Until end_date or 8 hours
   - Type: 'project'

## Status Updates

### Repair Status Changes

When repair status changes:
- **Completed**: Title changes to "✅ [Repair Title]"
- **Cancelled**: Title changes to "✅ [Repair Title]" with status in description

### Project Status Changes

When project status changes:
- **Completed**: Title changes to "✅ [Project Title]"
- **On Hold**: Title changes to "⏸️ [Project Title]"
- Description includes current status

## Database Triggers

### Creation Triggers
- `trigger_create_calendar_event_for_repair` - Creates calendar events for new repairs
- `trigger_create_calendar_event_for_project` - Creates calendar events for new projects

### Update Triggers
- `trigger_update_calendar_event_for_repair` - Updates calendar events when repairs change
- `trigger_update_calendar_event_for_project` - Updates calendar events when projects change

### Deletion Triggers
- `trigger_delete_calendar_event_for_repair` - Removes calendar events when repairs are deleted
- `trigger_delete_calendar_event_for_project` - Removes calendar events when projects are deleted

## Code Integration

### RepairsContext.tsx
- Removed manual calendar event creation
- Database triggers handle automatic creation
- Calendar events appear in user's calendar automatically

### ProjectsContext.tsx
- Removed manual calendar event creation
- Database triggers handle automatic creation
- Calendar events appear in user's calendar automatically

### CalendarContext.tsx
- Already handles calendar events from all sources
- No changes needed - automatically picks up repair/project events

## Testing

Use the test script `test_calendar_integration.sql` to verify:

1. Calendar events are created for repairs with due_date
2. Calendar events are created for projects with start_date
3. Home calendar events mapping is created correctly
4. Event details are properly formatted

## Benefits

1. **Automatic**: No manual calendar event creation needed
2. **Consistent**: All repairs and projects appear in calendar
3. **Real-time**: Events appear immediately when created
4. **Status-aware**: Events update when status changes
5. **Home-specific**: Events are properly linked to homes via mapping table

## Migration Files

- `create_repairs_projects_calendar_triggers.sql` - Main trigger implementation
- `test_calendar_integration.sql` - Test script
- `README_calendar_integration.md` - This documentation

## Usage

No code changes needed in the application. The integration works automatically:

1. Create repair with due_date → Calendar event appears
2. Create project with start_date → Calendar event appears
3. Update repair/project status → Calendar event updates
4. Delete repair/project → Calendar event removed

The calendar will show all scheduled work alongside regular calendar events and tasks.
