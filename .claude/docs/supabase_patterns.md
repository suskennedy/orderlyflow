# Supabase Patterns

## Client Setup

Single lazy-initialized client exported from `lib/supabase.ts`. Accessed as `supabase` (Proxy) or `getSupabase()` function. All stores and hooks import from this module.

Environment variables required: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## Type Generation

```bash
yarn types
# expands to: npx supabase gen types typescript --linked > supabase-types.ts
```

Run this after any Supabase schema migration. The output file (`supabase-types.ts`) is the source of truth for all DB types. Stores import from it as:
```ts
import { Database } from '../../supabase-types';
type X = Database['public']['Tables']['table_name']['Row'];
```

## Key Tables

| Table | Purpose |
|---|---|
| `homes` | User's properties |
| `home_tasks` | Tasks associated with a home (from templates or custom) |
| `tasks` | Global task templates (read-only catalog) |
| `repairs` | Repair requests per home |
| `projects` | Home improvement projects |
| `appliances` | Appliances per home |
| `filters` | HVAC/water filters per home |
| `materials` | Building materials per home |
| `paint_colors` | Paint records per home |
| `warranties` | Appliance/item warranties |
| `pools` | Pool records per home |
| `vendors` | Service vendor contacts |
| `calendar_events` | Calendar items linked to tasks/repairs/projects |
| `user_profiles` | Extended user data beyond Supabase Auth |
| `inventory` | General inventory items |

## Query Patterns

All queries follow the `{ data, error }` destructuring pattern:
```ts
const { data, error } = await supabase.from('table').select('*').eq('field', value);
if (error) throw error;
```

Stores always set `loading: false` in both success and catch paths.

Joined queries use Supabase embedded relations:
```ts
.select(`*, homes!inner(name)`)   // inner join
.select(`*, homes(name)`)         // left join
```

## Realtime

Subscriptions use `supabase.channel(name).on('postgres_changes', options, callback).subscribe()`.

`lib/hooks/useRealTimeSubscription.ts` provides a React hook wrapper with cleanup.

App-level subscription for `homes` and `home_tasks` is managed by `useHomesSubscriptionManager` (called once in root layout). Individual stores do NOT set up their own subscriptions by default — data is refreshed by calling `fetchX` after mutations.

Calendar event cleanup: when a task/repair/project is completed, its `calendar_events` rows are deleted directly in the same action. See `lib/stores/tasksStore.ts:729`.

## Auth Patterns

- `supabase.auth.getUser()` is called inside store actions to get the current user ID (not passed as prop)
- RLS policies on Supabase enforce row ownership by `user_id`
- `useAuth` hook (`lib/hooks/useAuth.ts`) handles session state and auto-creates `user_profiles` row on first login

## Storage

File uploads go through `lib/services/StorageService.ts` and `lib/services/uploadService.ts`. Images stored in Supabase Storage buckets, with URLs saved as string arrays in table columns (e.g., `photos_videos`, `photos_inspiration`).

`lib/utils/imageUtils.ts` — image manipulation helpers.
`lib/services/StorageService.ts` — upload/delete from Supabase Storage buckets.
