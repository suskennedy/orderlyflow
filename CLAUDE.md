# OrderlyFlow

A home management mobile app for tracking tasks, appliances, filters, materials, warranties, repairs, projects, and vendors across multiple properties.

## Tech Stack

- **Framework**: React Native 0.79 + Expo ~53
- **Routing**: Expo Router v5 (file-based, grouped routes)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **State**: Zustand v5 stores per domain
- **Forms**: React Hook Form + Zod schemas
- **UI**: Custom theme system + React Native Paper + @expo/vector-icons
- **Language**: TypeScript ~5.8

## Key Directories

| Path | Purpose |
|---|---|
| `app/` | Expo Router screens (file = route) |
| `app/(auth)/` | Sign in, sign up, forgot password |
| `app/(tabs)/` | Main tab navigator |
| `app/(tabs)/(home)/[homeId]/` | Per-home detail: appliances, filters, materials, paints, warranties, pools, tasks |
| `app/(tabs)/(tasks)/` | Global tasks, add-repair, add-project |
| `app/(tabs)/(flo)/` | "Flo" AI assistant chat |
| `lib/stores/` | Zustand stores (one per domain) |
| `lib/schemas/` | Zod validation schemas (mirrored per domain) |
| `lib/services/` | External service wrappers (Supabase storage, email, Google Places) |
| `lib/hooks/` | Custom hooks (useAuth, useCalendar, useRealTimeSubscription) |
| `lib/contexts/` | React Contexts: ThemeContext, ToastContext |
| `lib/auth/actions.ts` | Supabase auth server actions |
| `lib/navigation.ts` | Centralized route constants + `navigate` helper |
| `lib/supabase.ts` | Lazy singleton Supabase client |
| `components/` | UI components organized by domain |
| `types/` | TypeScript types (`types.ts`, `family.ts`, `database-extended.ts`) |
| `supabase-types.ts` | Auto-generated DB types (do not edit manually) |

## Commands

```bash
# Start dev server
npx expo start

# Run on Android / iOS
npx expo run:android
npx expo run:ios

# Lint
npx expo lint

# Regenerate Supabase types (requires linked Supabase project)
yarn types
```

## Environment Variables

Required in `.env.local`:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Additional Documentation

Check these files when working on related areas:

| Topic | File |
|---|---|
| Architecture patterns, state, data flow | `.claude/docs/architectural_patterns.md` |
| Supabase schema, RLS, realtime | `.claude/docs/supabase_patterns.md` |
