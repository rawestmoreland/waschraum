# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this app is

Waschraum is a laundry room management app for apartment buildings. Residents can check machine availability, start laundry sessions, join waitlists, and nudge other residents. The backend is a custom PocketBase instance (Go); the frontend is an Expo/React Native app targeting iOS, Android, and web.

## Commands

### Expo app (root)
```bash
npm start          # start dev server (choose platform interactively)
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # browser
npm run lint       # ESLint via expo lint
```

### PocketBase backend (pocketbase/)
```bash
cd pocketbase && make run          # run locally on :8080
cd pocketbase && make build        # build Docker image
cd pocketbase && make recreate     # force-recreate Docker container
```

PocketBase admin UI is at `http://127.0.0.1:8080/_/` when running locally.

### Type generation
Types in `src/types/pocketbase-types.ts` are auto-generated via `pocketbase-typegen`. Re-run after schema changes:
```bash
npx pocketbase-typegen --db ./pocketbase/base/pb_data/data.db --out src/types/pocketbase-types.ts
```

## Architecture

### Provider hierarchy (`src/app/_layout.tsx`)
```
PocketBaseProvider  →  initializes pb client, stores session in AsyncStorage
  AuthProvider      →  reads pb.authStore, handles route protection
    ThemeProvider   →  light/dark from system
      Stack         →  expo-router navigation
```

### Route groups
- `(auth)/` — login, signup; accessible when logged out
- `(guarded)/` — home and future protected screens
- `index.tsx` — entry point (currently a welcome/debug screen)

Route protection lives in `src/contexts/auth.tsx` via `useProtectedRoute`: unauthenticated users are redirected to `/(auth)/login`; authenticated users are pushed out of `(auth)/` to `/(guarded)/`.

### PocketBase client (`src/lib/pocketbase.tsx`)
- `PocketBaseProvider` creates a single `PocketBase` instance using `AsyncAuthStore` backed by `@react-native-async-storage/async-storage` (key: `pb_auth`).
- The base URL comes from `process.env.PB_URL`.
- Access the client anywhere with `usePocketBase()`.

### API layer (`src/lib/api/`)
Plain object modules that accept a `PocketBase` instance and call the SDK. Add new collections here following the `MachinesApi` pattern.

### Domain model (key PocketBase collections)
- `buildings` — apartment buildings (has `invite_code`)
- `machines` — washers/dryers; status: `available | in_use | fault`
- `residents` — join table between `users` and `buildings`; role: `resident | admin`
- `sessions` — a laundry session tied to a machine + resident
- `waitlist_entries` — queue for a machine
- `nudges` — push one resident to move their laundry

### Theming (`src/constants/theme.ts`)
- Colors: `Colors.light` / `Colors.dark` — use `useTheme()` hook
- Spacing scale: `Spacing.half` (2) through `Spacing.six` (64)
- `MaxContentWidth = 800` — wrap content views in a row flex so the UI looks good on web
- `BottomTabInset` — platform-specific padding above bottom tabs

### Platform-specific files
Files with `.web.ts(x)` suffixes shadow the default on web (e.g., `animated-icon.web.tsx`, `app-tabs.web.tsx`, `use-color-scheme.web.ts`). Follow this pattern for any web-specific overrides.

### Path aliases
`@/*` resolves to `src/*`; `@/assets/*` resolves to `assets/*`.

## EAS build channels
| Profile | Channel | Distribution |
|---|---|---|
| `development` | develop | internal |
| `development-simulator` | develop-simulator | internal (iOS sim) |
| `preview` | staging | internal |
| `production` | production | store |

`APP_ENV` env var is set per build profile.
