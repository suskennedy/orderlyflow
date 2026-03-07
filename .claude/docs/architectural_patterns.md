# Architectural Patterns

## Routing — Expo Router File-Based Routing

Routes map directly to the `app/` file tree. Groups in parentheses `(auth)`, `(tabs)`, `(home)` are layout groups — they don't appear in the URL.

Dynamic segments use brackets: `[homeId]`, `[id]`.

Each group directory has a `_layout.tsx` that wraps its children (Stack, Tabs, etc.).

Entry point flow: `app/index.tsx` → auth check → `(tabs)` or `(auth)/signin`.

## State Management — Zustand Domain Stores

Each data domain has a dedicated Zustand store in `lib/stores/`:

```
homesStore.ts       vendorsStore.ts     tasksStore.ts
appliancesStore.ts  filtersStore.ts     warrantiesStore.ts
materialsStore.ts   paintsStore.ts      poolsStore.ts
repairsStore.ts     projectsStore.ts    calendarStore.ts
inventoryStore.ts
```

**Store structure convention** (see `lib/stores/homesStore.ts:29`):
- State fields at the top
- Simple setters (`setX`) for direct mutation
- Async actions (`fetchX`, `createX`, `updateX`, `deleteX`) that hit Supabase and then update local state
- Optimistic local updates on write operations

**Accessing stores outside React** (for realtime callbacks):
```ts
useHomesStore.getState().fetchHomes()   // read/call outside components
useHomesStore.setState({ homes: [...] }) // write outside components
```

## Form Validation — Zod + React Hook Form

All forms use a Zod schema defined in `lib/schemas/` + `@hookform/resolvers/zod`.

Schemas are co-located by domain:
```
lib/schemas/repairSchema.ts
lib/schemas/projectSchema.ts
lib/schemas/home/applianceFormSchema.ts
lib/schemas/home/filterFormSchema.ts
lib/schemas/home/homeFormSchema.ts
lib/schemas/home/materialFormSchema.ts
lib/schemas/home/paintColorFormSchema.ts
lib/schemas/home/poolFormSchema.ts
lib/schemas/home/warrantyFormSchema.ts
lib/schemas/tasks/taskFormSchema.ts
lib/schemas/tasks/customTaskFormSchema.ts
lib/schemas/vendors/vendorFormSchema.ts
```

Schemas export both the Zod object and its inferred type:
```ts
export const repairFormSchema = z.object({ ... })
export type RepairFormData = z.infer<typeof repairFormSchema>
```
See `lib/schemas/repairSchema.ts:3`.

## Database Types

`supabase-types.ts` is auto-generated from the linked Supabase project via `yarn types`. Never edit it manually.

Stores import specific row/insert/update types:
```ts
type HomeTask = Database['public']['Tables']['home_tasks']['Row'];
type HomeTaskInsert = Database['public']['Tables']['home_tasks']['Insert'];
```
See `lib/stores/tasksStore.ts:6`.

Extended/custom types live in `types/database-extended.ts` and `types/family.ts`.

## Realtime Subscriptions

**Low-level hook**: `lib/hooks/useRealTimeSubscription.ts` wraps Supabase `channel().on('postgres_changes')` with auto-cleanup on unmount.

**App-level manager**: `lib/services/homesSubscriptionManager.ts` — used once at root (`app/_layout.tsx:29`) via `useHomesSubscriptionManager()`. Handles `homes` and `home_tasks` INSERT/UPDATE/DELETE events and keeps Zustand stores in sync. Debounces task count refreshes (300ms).

Pattern for adding a new subscription: create a service/hook that calls `useRealTimeSubscription` and updates the relevant Zustand store.

## Theme System

`lib/contexts/ThemeContext.tsx` provides `useTheme()` hook.

- Three modes: `'light' | 'dark' | 'system'` (persisted to AsyncStorage)
- Semantic color tokens via `colors` object (background, surface, text, primary, secondary, accent, status colors)
- All screens access `colors` via `const { colors, isDark } = useTheme()`

Light primary: `#7fbbdd` (blue), secondary: `#f58b05` (orange), accent: `#ffc22f` (yellow).

See `lib/contexts/ThemeContext.tsx:51` for full color token reference.

## Navigation

`lib/navigation.ts` exports:
- `routes` object — all route strings in one place (see `:4`)
- `navigate` object — type-safe wrappers around `router.push/replace/back`

Prefer `navigate.toX()` helpers or `routes.x.path` strings over hardcoded route strings in screens.

## Authentication

`lib/hooks/useAuth.ts` — primary auth hook. Manages `session`, `user`, `userProfile`, `loading`. Automatically creates a `user_profiles` row on first sign-in if one doesn't exist.

`lib/auth/actions.ts` — server-side auth actions (e.g., `signOut`).

Auth flow: `useAuth` is called per-screen or in root layout. Route protection is done by checking `isAuthenticated` and calling `navigate.toSignIn()`.

## Unified Task Model

`lib/stores/tasksStore.ts` normalizes `repairs` and `projects` into the `HomeTask` shape so the task list UI works with a single data type. Prefixed IDs (`repair_${id}`, `project_${id}`) distinguish these items from real `home_tasks` rows. The `completeHomeTask` action dispatches to the correct Supabase table based on ID prefix. See `tasksStore.ts:712`.

## Supabase Client

`lib/supabase.ts` — lazy singleton via a Proxy. The client is not created until first property access (avoids SSR issues). Storage backend switches between `AsyncStorage` (native) and `localStorage` (web). See `lib/supabase.ts:83`.

## Typography

Two font families loaded at app root (`app/_layout.tsx:31`):
- **Cormorant Garamond** — serif, used for headings/display
- **Jost** — sans-serif, used for body/UI text

## Services Layer

`lib/services/` wraps external integrations:
- `StorageService.ts` — Supabase Storage uploads/deletes
- `uploadService.ts` — file upload orchestration
- `GooglePlacesService.ts` — address autocomplete
- `emailService.ts` — email notifications
- `InventoryService.ts` — inventory-specific data operations
- `homesSubscriptionManager.ts` — realtime subscription setup
