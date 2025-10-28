# Modular Layout System

This directory contains modular layout components that provide consistent navigation and styling across the application.

## Base Components

### `BaseStackLayout`
The foundation component that provides common stack navigation patterns with:
- Status bar management
- Theme-aware styling
- Configurable animations
- Customizable background colors

### `AppLayout`
Main application layout wrapper that includes:
- Footer navigation
- Safe area handling
- Content padding management

## Main Layout Components

### `AuthLayout`
Handles authentication screens:
- Sign in
- Sign up
- Forgot password

### `ProfileLayout`
Manages profile-related screens:
- Profile index
- Profile edit

### `DashboardLayout`
Dashboard screen layout with:
- Authentication check
- Loading state handling
- Redirect logic

### `TabsLayout`
Main tabs navigation layout for:
- Dashboard
- Home
- Tasks
- Vendors
- Flo
- Settings

## Tab-Specific Layouts

### `HomeLayout`
Home tab navigation

### `SettingsLayout`
Settings screens with all sub-routes:
- Family management
- Invite members
- Feedback
- Report bug
- Contact support
- Privacy policy
- Terms of service

### `TasksLayout`
Tasks tab navigation

### `VendorsLayout`
Vendors management with:
- Vendor list
- Vendor detail
- Vendor edit

### `FloLayout`
Flo chat interface with:
- Main chat screen
- Chat interface

## Detail Layout Components

### `HomeDetailLayout`
Home detail screens including:
- Home info
- Appliances
- Paints
- Warranties
- Materials
- Filters
- Tasks
- Calendar

### `HomeTasksLayout`
Home-specific task management:
- Task list
- Task settings
- Add tasks

### `DetailLayout`
Generic detail layout for edit screens:
- Material edit
- Paint edit
- Warranty edit
- Filter edit
- Appliance edit

## Usage

All layout components are designed to be drop-in replacements for the original layout files. They maintain the same functionality while providing:

1. **Consistency**: Unified styling and behavior
2. **Maintainability**: Centralized layout logic
3. **Reusability**: Shared components across different routes
4. **Type Safety**: TypeScript interfaces for all props

## Import Examples

```typescript
// Individual imports
import AuthLayout from '../../components/layouts/AuthLayout';

// Barrel imports
import { AuthLayout, DashboardLayout } from '../../components/layouts';
```

## Benefits

- **DRY Principle**: Eliminates code duplication across layout files
- **Centralized Updates**: Changes to layout behavior can be made in one place
- **Consistent UX**: Ensures uniform navigation experience
- **Easy Testing**: Modular components are easier to test individually
- **Scalability**: Easy to add new layout patterns as needed
