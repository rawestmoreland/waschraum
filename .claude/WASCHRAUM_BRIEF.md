# Waschraum — Project Brief

A realtime communal laundry room coordinator for Swiss apartment buildings. Solves the daily frustration of shared laundry machines in multi-tenant buildings — replacing paper sign-up sheets and WhatsApp groups with a live, mobile-first app.

---

## Product Overview

Residents of a building open the app and see every washer and dryer in real time — whether it's free, in use, or faulty. They slide a toggle to claim a machine when they start their wash, and slide it back when they're done. If all machines are busy they can join a waitlist and get a push notification the moment a machine is released.

The interaction pattern is deliberately modelled on the SBB/ZVV EasyRide toggle — slide right to start, slide left to stop. No booking in advance, no time slots, just live state.

---

## Tech Stack

- **Backend:** PocketBase, extended with **Go** (not JavaScript). All server-side hooks, business logic, and cron jobs are written in Go using PocketBase's Go extension API.
- **Frontend:** React Native (Expo)
- **Realtime:** PocketBase's built-in SSE-based realtime subscriptions via the PocketBase JS SDK
- **Auth:** PocketBase built-in auth (email/password)
- **Payments:** Stripe (for future monetisation)
- **Hosting:** Single Hetzner VPS

> ⚠️ PocketBase is extended in **Go only**. Do not use PocketBase's JavaScript hooks/JSVM. All `OnRecordBeforeUpdateRequest`, `OnRecordAfterCreateRequest`, cron jobs, and custom routes are implemented in Go via `app.OnRecordBeforeUpdateRequest()` etc.

---

## Data Model

### `users` — PocketBase built-in auth collection

| Field   | Type | Notes              |
| ------- | ---- | ------------------ |
| `name`  | text | required           |
| `email` | text | required, built-in |

---

### `buildings`

| Field         | Type | Notes                          |
| ------------- | ---- | ------------------------------ |
| `name`        | text | e.g. "Seefeldstrasse 42"       |
| `address`     | text | optional                       |
| `invite_code` | text | unique, 6-char, auto-generated |

---

### `residents`

The domain identity of a user within a building. A user may have multiple resident records (one per building) but in MVP we treat it as one.

| Field       | Type                 | Notes                                                                                       |
| ----------- | -------------------- | ------------------------------------------------------------------------------------------- |
| `user`      | relation → users     | required                                                                                    |
| `building`  | relation → buildings | required                                                                                    |
| `apartment` | text                 | optional, freetext e.g. "3. OG links", "EG rechts" — Swiss buildings don't use unit numbers |
| `role`      | select               | `resident` \| `admin`, default `resident`                                                   |

---

### `machines`

| Field         | Type                 | Notes                                                      |
| ------------- | -------------------- | ---------------------------------------------------------- |
| `building`    | relation → buildings | required — the structural anchor, independent of occupancy |
| `type`        | select               | `washer` \| `dryer`                                        |
| `label`       | text                 | e.g. "Washer 1", "Dryer A"                                 |
| `status`      | select               | `available` \| `in_use` \| `fault`, default `available`    |
| `occupied_by` | relation → residents | nullable                                                   |
| `started_at`  | datetime             | nullable, set when session begins                          |

> Note: `building` and `occupied_by` are separate fields by design. A machine belongs to a building permanently; `occupied_by` is transient state that gets set and cleared constantly. An available machine has `occupied_by = null` so you cannot infer building from occupancy alone.

---

### `sessions` — immutable log

| Field        | Type                 | Notes                                         |
| ------------ | -------------------- | --------------------------------------------- |
| `machine`    | relation → machines  | required                                      |
| `resident`   | relation → residents | required                                      |
| `building`   | relation → buildings | required, denormalised for efficient querying |
| `started_at` | datetime             | required                                      |
| `ended_at`   | datetime             | nullable, set on close                        |
| `duration`   | number               | minutes, computed on close                    |

Sessions are created and closed by Go hooks only. Never mutated by the client.

---

### `waitlist_entries`

| Field         | Type                 | Notes                                                                                                      |
| ------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `machine`     | relation → machines  | required                                                                                                   |
| `resident`    | relation → residents | required                                                                                                   |
| `building`    | relation → buildings | required, denormalised                                                                                     |
| `joined_at`   | datetime             | required, auto now — **implicit position**, queue order is always derived by sorting `joined_at` ascending |
| `notified_at` | datetime             | nullable, set when resident is pinged                                                                      |
| `expires_at`  | datetime             | nullable, set when resident reaches first in queue (10 min window to claim)                                |

> `position` is not stored. It is computed client-side as the index of the resident's entry in the `joined_at`-sorted list. Storing it would require updating multiple records atomically on every join, leave, or expiry — unnecessary complexity. `joined_at` is the single source of truth for queue order.

---

### `nudges`

| Field           | Type                 | Notes                  |
| --------------- | -------------------- | ---------------------- |
| `machine`       | relation → machines  | required               |
| `from_resident` | relation → residents | required               |
| `to_resident`   | relation → residents | required               |
| `building`      | relation → buildings | required, denormalised |
| `created_at`    | datetime             | auto now               |

One nudge per session. Enforced in the Go hook by checking existing nudges against the machine's current `started_at`.

---

### `machine_views`

Passive signal — logged every time a resident opens a machine detail screen. Used to show latent demand to the current occupant without a formal waitlist join.

| Field       | Type                 | Notes                  |
| ----------- | -------------------- | ---------------------- |
| `machine`   | relation → machines  | required               |
| `resident`  | relation → residents | required               |
| `building`  | relation → buildings | required, denormalised |
| `viewed_at` | datetime             | auto now               |

Deduped per resident per session window — upsert on (machine, resident) rather than inserting a new record each time. Only views since the current `started_at` are counted.

Displayed on the machine detail screen to the current occupant only, once ≥ 2 unique residents have viewed:

```
👀  4 neighbours checked this machine recently
```

---

## API Rules (PocketBase)

### `users`

| Operation | Rule                     |
| --------- | ------------------------ |
| List      | `""` — not listable      |
| View      | `id = @request.auth.id`  |
| Create    | `""` — open registration |
| Update    | `id = @request.auth.id`  |
| Delete    | `id = @request.auth.id`  |

### `buildings`

| Operation       | Rule                                             |
| --------------- | ------------------------------------------------ |
| List / View     | `id = @request.auth.residents_via_user.building` |
| Create          | `""` — admin/server only                         |
| Update / Delete | `""` — admin only                                |

### `residents`

| Operation   | Rule                                                   |
| ----------- | ------------------------------------------------------ |
| List / View | `building = @request.auth.residents_via_user.building` |
| Create      | `user = @request.auth.id`                              |
| Update      | `user = @request.auth.id`                              |
| Delete      | `""` — admin only                                      |

### `machines`

| Operation   | Rule                                                                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| List / View | `building = @request.auth.residents_via_user.building`                                                                              |
| Create      | `""` — admin/building admin only                                                                                                    |
| Update      | `building = @request.auth.residents_via_user.building && (occupied_by = "" \|\| occupied_by = @request.auth.residents_via_user.id)` |
| Delete      | `""` — admin only                                                                                                                   |

### `sessions`

| Operation       | Rule                                                   |
| --------------- | ------------------------------------------------------ |
| List / View     | `resident = @request.auth.residents_via_user.id`       |
| Create          | `building = @request.auth.residents_via_user.building` |
| Update / Delete | `""` — immutable, Go hook only                         |

### `waitlist_entries`

| Operation   | Rule                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| List / View | `building = @request.auth.residents_via_user.building`                                                   |
| Create      | `building = @request.auth.residents_via_user.building && resident = @request.auth.residents_via_user.id` |
| Update      | `""` — position managed by Go hook only                                                                  |
| Delete      | `resident = @request.auth.residents_via_user.id`                                                         |

### `nudges`

| Operation       | Rule                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| List / View     | `building = @request.auth.residents_via_user.building`                                                        |
| Create          | `building = @request.auth.residents_via_user.building && from_resident = @request.auth.residents_via_user.id` |
| Update / Delete | `""` — immutable                                                                                              |

### `machine_views`

| Operation       | Rule                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| List / View     | `building = @request.auth.residents_via_user.building`                                                   |
| Create          | `building = @request.auth.residents_via_user.building && resident = @request.auth.residents_via_user.id` |
| Update / Delete | `""` — managed by Go hook                                                                                |

---

## Go Hook Logic

All implemented in Go using PocketBase's hook API. Two categories:

- **Request hooks** (`OnRecordCreateRequest`, `OnRecordUpdateRequest` etc.) — fire during the request lifecycle, used for validation and blocking. Must call `e.Next()` to continue.
- **After hooks** (`OnRecordAfterCreateSuccess`, `OnRecordAfterUpdateSuccess`, `OnRecordAfterDeleteSuccess`) — fire after a record is successfully written, used for side effects.

### On machine status → `available` (session ended)

```go
// Side effect — fires after machine update succeeds
app.OnRecordAfterUpdateSuccess("machines").BindFunc(func(e *core.RecordEvent) error {
    // 1. Check if status changed to 'available'
    // 2. Close the session record (set ended_at, compute duration)
    // 3. Find first waitlist_entry for this machine by position
    // 4. Set their notified_at = now, expires_at = now + 10 min
    // 5. Send push notification
    return e.Next()
})
```

### On nudge create — enforce one per session

```go
// Validation — fires during request, can block with error
app.OnRecordCreateRequest("nudges").BindFunc(func(e *core.RecordRequestEvent) error {
    // Check if a nudge already exists for this machine
    // where machine.started_at matches current session window
    // Return error to block if duplicate found
    return e.Next()
})
```

### On machine_view create — upsert behaviour

```go
// Validation — intercept and convert to update if record exists
app.OnRecordCreateRequest("machine_views").BindFunc(func(e *core.RecordRequestEvent) error {
    // Check if a view record exists for (machine, resident) since machine.started_at
    // If yes, update viewed_at on existing record and abort insert
    // If no, allow insert via e.Next()
    return e.Next()
})
```

### On waitlist_entry expires_at passed (cron, every minute)

```go
// Scheduled via app.Cron().Add(...)
// Find waitlist_entries where expires_at < now and notified_at is set
// Delete expired entry — triggers OnRecordAfterDeleteSuccess below
```

### On waitlist_entry deleted — promote next in queue

```go
// Side effect — fires after waitlist_entry delete succeeds
app.OnRecordAfterDeleteSuccess("waitlist_entries").BindFunc(func(e *core.RecordEvent) error {
    // No position reordering needed — queue order is always derived from joined_at
    // Find the entry with the earliest joined_at for this machine where expires_at is null
    // Set their expires_at = now + 10 min
    // Send push notification to that resident
    return e.Next()
})
```

### Auto-release after 3 hours (cron, every 15 min)

```go
// Scheduled via app.Cron().Add(...)
// Find machines where status = 'in_use' AND started_at < now - 3h
// Update status = 'available', occupied_by = null, started_at = null
// Triggers OnRecordAfterUpdateSuccess above
```

---

## Realtime Subscriptions (React Native)

Fetch the resident record once on login and cache `resident.id` and `resident.building` locally. Use these for all subscriptions and queries.

```js
// On login
const resident = await pb
  .collection('residents')
  .getFirstListItem(`user = "${pb.authStore.model.id}"`);

// All machines in building — home screen
pb.collection('machines').subscribe('*', callback, {
  filter: `building = "${resident.building}"`,
});

// Own waitlist entries — for queue position updates
pb.collection('waitlist_entries').subscribe('*', callback, {
  filter: `resident = "${resident.id}"`,
});

// Nudges directed at you
pb.collection('nudges').subscribe('*', callback, {
  filter: `to_resident = "${resident.id}"`,
});
```

---

## UX Notes

### The toggle

Modelled on SBB/ZVV EasyRide. Slide right to start a session, slide left to end it. No booking in advance, no time slots.

### Nudge rules

- Only available if current session > 45 minutes
- One nudge per session per resident
- Conditions are displayed visually in the UI before the button is enabled

### Machine views (latent demand signal)

- Logged passively when a resident opens the machine detail screen
- Only shown to the current occupant
- Only shown when ≥ 2 unique residents have viewed since session start
- Resets per session

### Apartment field

Swiss buildings use floor + position notation, not unit numbers. The `apartment` field is freetext and optional. Examples: "3. OG links", "EG rechts", "Dachgeschoss". Display name alone is sufficient in small buildings.

### Waitlist claim window

When a machine becomes free and a resident is first in queue, they have 10 minutes to claim it (slide the toggle). After 10 minutes the machine is offered to the next person in queue.

---

## Screens (designed, reference for UI scaffolding)

1. **Home** — building overview, all machines grouped by type (washers / dryers), live status, your active session banner
2. **Machine Detail** — SBB-style toggle, session timer, machine stats, dryer chaining prompt, waitlist peek
3. **Waitlist** — queue position, nudge card with conditions, full queue list, notification preview

---

## Monetisation

- Free tier: up to 2 machines per building
- Paid tier: CHF 4.90/month per building — unlimited machines, waitlist notifications, home screen widget
- Payment via Stripe
- Break-even at ~4 paid buildings given fixed costs of ~CHF 15/month (VPS + Apple dev + domain + Stripe fees)

---

## Current Status

- Auth scaffolding: in progress
- UI scaffolding: starting
- Backend scaffolding: starting
- PocketBase collections: to be created
- Go hooks: to be implemented
