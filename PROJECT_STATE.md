# PROJECT_STATE: khenov-demo-gym (Nabd Gym member app)

Fictional gym "Nabd / نبض". Demo by KHENOV. Contract: `docs/CONTRACT.md`.

## Done

### M0 Foundation

- Expo SDK 58, React Native 0.88, Expo Router (`src/app`), TypeScript strict, ESLint, Prettier.
- Theme tokens (`src/theme`): dark (default) and light palettes, signal-yellow accent, 8pt spacing, radius, type scale (Changa for display, Readex Pro for text), shadow, motion.
- i18n AR/EN, Arabic default, localized digits, EGP currency, dates, 12h clock, Arabic plural forms.
- Demo kit (`src/lib/demo`): namespaced storage, `delay`, `resetDemo`, seed versioning, fast mode.
- Seed: 1 member, 3 trainers, 12 weekly classes, 30 exercises, 3 workout plans, 3 membership plans, 8 weeks of body entries, 5 personal records, 5 achievements, 24 logged sessions.
- Repositories (`src/data/repository`): session, member, trainers, classes, exercises, workout plans, membership, progress, prefs.
- UI primitives (`src/components/ui`): Text, Icon, Logo, Button, Card, Screen, Skeleton, EmptyState, ErrorState, DemoBadge, SegmentedControl, BottomSheet, ConfirmSheet, PendingFeature.
- Flow: splash, 3-slide swipeable onboarding (skippable), "Continue as demo member", 5-tab shell, Home (greeting + streak from the repository, with skeleton and error states), Profile (language, theme, Reset demo).

### M0 fix 1

- Removed the restart-based RTL flow that blocked Expo Go. Language and direction now switch instantly. Removed `expo-updates`.

### M0 fix 2

- Web console errors fixed: native-only a11y props (`accessibilityElementsHidden`, `importantForAccessibility`) were reaching DOM elements through react-native-svg. Decorative elements now use `aria-hidden`, the logo uses `aria-label`. Rule: only `aria-*` props on elements that can render as SVG/DOM on web.

### M1 fix: demo bookings follow today at runtime

- The seed stores no fixed bookings, only two standing "demo slots". On every read the next upcoming occurrence of each slot is worked out for the current day, so a visitor opening the demo days later still has bookings ahead. Bookings the member made are stored as they are and never touched.
- Cancelling a demo booking releases its slot for good (until Reset demo); undo restores it. `SEED_VERSION` is 3.
- Tests: two upcoming, non-overlapping bookings on 14 different days and several hours, and as stored state ages for 40 days.

### M2 Workout session flow + Progress

- Workout tab: today's workout from the schedule (or a rest day), all three plans with their days, plan detail (days, exercises, sets x reps, rest, estimated time), start session, resume or discard banner (also on Home), recent sessions, exercise library (search and muscle filter) and exercise detail with a small chart of the best weight per session.
- Active session (`/session`): exercise card with icon, target, last time; weight and reps steppers with large targets; "same as last"; complete set; add or skip a set; undo last set; swipe or buttons between exercises; exercise list sheet; automatic rest timer (60 to 90 s, plus or minus 15 s, pause, skip) with haptics and spoken announcements at the start, at ten seconds and at the end.
- The timer stores timestamps (`endsAt`), so it is exact after re-renders, background time and app restarts. Only the countdown component ticks. The live session is saved after every change and offered for resuming after a restart.
- Finish saves to history and opens the summary: time, volume, sets, new records highlighted, streak, unlocked achievements, a short transform and opacity celebration. Leaving early asks: save what was done, discard, or continue.
- Progress tab: range selector (4 weeks, 8 weeks, all), weight chart, one selectable measurement chart, weekly volume bars, all drawn with react-native-svg; touch or drag shows a value tooltip; every chart has a text summary and a spoken label. Add, edit and delete measurements with Undo. Personal records, streak, five achievements.
- Rules in `src/data/rules` with typed errors: set validation, volume, record detection, streak, achievements, rest timer, active session, body measurements.
- History is generated at runtime relative to today (24 sessions over eight weeks, a six day streak ending yesterday), so one workout today makes a seven day streak and unlocks two achievements. Sessions done in the demo are stored and appended.

## Next

- M3: Membership, QR check-in pass, profile and settings (notification toggles simulated), motion and gestures polish, RTL audit, accessibility pass, performance on mid-range Android.

## Decisions

- Typed routes are off (`experiments.typedRoutes` removed, `.expo/types` no longer in tsconfig). The generated route types only refresh when the dev server or an export runs, so `npm run check` failed after any milestone that added a route until the server was started once. Routes are plain strings now; the check no longer depends on generated files.

- Classes are weekly templates; sessions are generated for a rolling window (the current Saturday-based week plus the next one), so the demo works on any day. Only the member's bookings and small seat adjustments are stored.
- Seed version is 2 (the class data model changed), so old local data is purged and reseeded automatically.
- The day selector shows one week of seven days in a fixed row with previous/next week buttons, instead of a horizontal scroll list, so there is no scroll offset to mirror in RTL. Cells are about 45dp wide on a 360dp phone.
- Undo of a cancellation restores seat counts exactly (the repository keeps the previous state for 15 seconds), so a waitlist promotion caused by the cancel is reverted too.
- Chart time axis follows the reading direction: oldest on the left in English, oldest on the right in Arabic (the vertical axis labels stay on the start side). Tooltip and label positions are computed from the same mirrored scale, which is the only place physical `left` values are used.
- Streak means consecutive days with at least one workout. It stays alive when the last workout was yesterday, because today is not over.
- A record is a heavier set, or the same weight for more reps. The first time an exercise is logged sets a baseline and is not a record. Volume counts external weight only, so bodyweight sets add nothing.
- Achievements are computed from the real history. Earned ones are stored and never unlock twice; the seed stores the two already earned.
- Body measurements are stored (seeded as eight weekly entries ending on the day of seeding), so they can be edited and deleted. Unlike workouts they do not move with today's date; Reset demo refreshes them.
- Vitest instead of Jest: the rules are pure TypeScript, so no React Native transform is needed. It is the only new dependency (dev only).

- Accent is signal yellow on graphite, chosen to read as gym/industrial and to avoid the common neon-green look.
- Preferences (language, theme) live outside the versioned namespace, so Reset demo keeps them and does not force an RTL restart.
- Reset demo clears the namespace, reseeds, and returns to the splash, so the whole journey can be replayed.
- Seed dates are computed from "now" at seed time so progress history always ends this week.
- Onboarding uses a pan gesture and animated positions (no horizontal scroll view), so it behaves the same in RTL on native and web.
- Icons are imported one by one from `src/components/ui/icons.ts` to keep the bundle small (web common bundle 3.4 MB to 1.2 MB).
- `expo-localization` is not installed: default language is fixed to Arabic by the contract, and direction and formatting do not need device locale.
- Direction is driven by the `direction` style, not `I18nManager` (see RTL behavior).
- React Compiler is off (the reanimated shared-value pattern conflicts with its lint rules); shared values are written with `.set()`.

## RTL behavior

- The app language decides the layout direction on every platform, and switching is instant (no restart).
- Web: `<html dir>`, `lang` and the root view `dir`.
- Native (Expo Go and APK): the root view and each bottom sheet set the `direction` style, so rows, start/end spacing and swipe direction mirror without `I18nManager` and without reloading.
- History: the first M0 build used `I18nManager.forceRTL` plus a reload. In Expo Go on a real Android phone the direction did not apply after the reload and the app stopped on a "reopen the app" screen. That flow and its dependency (`expo-updates`) were removed in M0 fix 1.

## How to run

```powershell
npm install
npx expo start          # press w for web, or scan the QR with Expo Go (SDK 58) on Android
npm run check           # typecheck + lint + prettier check
```

Fast mode for recordings: web `?demo=fast`, or set `EXPO_PUBLIC_DEMO_FAST=1` before `npx expo start`.
