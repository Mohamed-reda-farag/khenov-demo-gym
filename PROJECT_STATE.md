# PROJECT_STATE: khenov-demo-gym (Nabd Gym member app)

Fictional gym "Nabd / نبض". Demo by KHENOV. Contract: `docs/CONTRACT.md`.

**Status:** M0 to M3 done, M4a (web hosting, README, repo hygiene) done. Next: M4b (Android APK, Portfolio Pack). Version 1.0.0. How to run, switches and deploy steps are in `README.md`.

## Done

### M0 Foundation

- Expo SDK 58, React Native 0.88, Expo Router (`src/app`), TypeScript strict, ESLint, Prettier.
- Theme tokens (`src/theme`): dark (default) and light palettes, signal-yellow accent, 8pt spacing, radius, type scale (Changa for display, Readex Pro for text), shadow, motion.
- i18n AR/EN, Arabic default, localized digits, EGP currency, dates, 12h clock, Arabic plural forms.
- Demo kit (`src/lib/demo`): namespaced storage, `delay`, `resetDemo`, seed versioning, fast mode.
- Seed: 1 member, 3 trainers, 12 weekly classes, 30 exercises, 3 workout plans, 3 membership plans, 8 weeks of body entries, 5 personal records, 5 achievements, 24 logged sessions.
- Repositories (`src/data/repository`): session, member, trainers, classes, exercises, workout plans, membership, progress, prefs.
- UI primitives (`src/components/ui`): Text, Icon, Logo, Button, Card, Screen, Skeleton, EmptyState, ErrorState, DemoBadge, SegmentedControl, BottomSheet, ConfirmSheet (a placeholder component that existed here was removed in M1).
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

### M3a Membership + mock checkout

- Membership screen (`/membership`, opened from Profile): plan, status (active, expiring within 14 days, expired), days left, period progress, perks, and a plan picker (price, per month, savings against monthly). Loading skeleton, error with retry, expired and expiring notices.
- Mock checkout (`/membership/checkout`): order summary, card or mobile wallet, field-level errors, simulated processing, receipt. The demo card is prefilled, so Renew, Pay, Done is three taps. `4000 0000 0000 0002` simulates a decline. A banner says nothing is charged.
- Rules in `src/data/rules/membership.ts` with typed `MembershipError`: status from dates (a stored membership expires by itself), renewal continues after the current end (an expired one restarts today), month arithmetic that never spills into the next month, Luhn card check, expiry good through the last day of its month, Egyptian mobile numbers, Arabic digits accepted.
- `membershipRepository.renew` and `onMembershipChanged` (Profile and Membership refresh after a renewal).
- New primitive: `TextField`. New helper: `ltrIsolate` for codes inside Arabic text.
- Session duration: gaps between actions count for at most 3 hours (`IDLE_GAP_CAP_MS`), so a forgotten session does not save as a 10 hour workout. The session clock shows the same capped time.
- Seeded body measurements now follow today (see Decisions). `SEED_VERSION` is 4.

### M3b Check-in pass, notifications, profile

- Pass (`/pass`, Home quick action): QR drawn with react-native-svg from our own encoder (`src/lib/qr/encoder.ts`: byte mode, level M, versions 1 to 10, no dependency). Dark on white in every theme, never mirrored. Status is an icon plus a word. "Simulate scan" records a visit (5 minute cooldown, blocked when expired), with toast and haptic. Stats (7 days, 30 days, per week) and a visits list. Expired: QR replaced by a locked panel and a Renew button.
- Notifications (`/notifications`, bell on Home with unread badge, row in Profile): class reminder on booking, waitlist promotion, achievements after a workout, payment after renewing, plus four seeded ones. Read, mark all read, empty and error states. Text is written at display time, so it follows the language.
- Profile: edit name (both languages) and initials (`/edit-profile`), simulated notification toggles (persisted, they decide which notifications are created), About card, Reset demo.
- Seeded membership now always has 38 days left, whenever the demo opens. A renewed membership has fixed dates and can lapse for real.
- `SEED_VERSION` is 5.

### M3c Polish

- `?demo=empty` and `?demo=error` now reach every screen (see `docs/QUALITY.md`, which also holds the RTL audit, accessibility notes, contrast ratios and bundle sizes).
- Fonts load per weight: 13 bundled files down to 5. Headings are real headings. Numeric fields align to the start edge in Arabic. Durations all come from tokens.

### M4a Web hosting, README, hygiene

- `npm run build:web` (`scripts/export-web.mjs`): static export into `dist/`, with Expo's `assets/node_modules` renamed to `assets/vendor` (some hosts skip `node_modules`) and a check that every referenced asset exists.
- `public/`: `index.html` template (Arabic, right to left and dark before the app loads, `noindex`), `_headers` (noindex header, one year cache for hashed files), `robots.txt`. No `404.html` on purpose: Cloudflare Pages then serves `index.html` for unknown addresses.
- `src/app/+not-found.tsx`: an intentional page for unknown addresses and bad deep links, in both languages.
- Verified with a static server that mimics the host: `/`, a nested deep link, a link with a query string and an unknown address all return `index.html`; scripts, fonts and `robots.txt` load. Not verified: rendering in a real browser (check the four addresses listed in the M4a report by hand after deploying).
- `app.json`: version 1.0.0 (the About card shows it), web title, description, theme colour and language.
- `npm audit`: 3 moderate findings, one chain (`minimatch` via `@expo/fingerprint`, Expo build tooling, not shipped). The offered fix downgrades Expo, so it is not applied.
- Hosting decision: Cloudflare Pages (free plan, root deployment, automatic single page fallback, header file). No account has been created yet.

## Demo switches

Web: add `?demo=` with a comma list, for example `?demo=fast,expired`. Native (PowerShell): `$env:EXPO_PUBLIC_DEMO="expired"; npx expo start -c`.

- `fast`: no simulated delays (also the old `EXPO_PUBLIC_DEMO_FAST=1`).
- `expired`, `expiring`: show the seeded membership as ended or ending in 7 days. Ignored once the member has renewed.
- `payfail`: the payment fails after processing, so the checkout failure state can be shown. Test card `4242 4242 4242 4242` pays, `4000 0000 0000 0002` is declined, both need no real data.
- `error`: every data read fails, so each screen shows its error state (the session is spared so the app opens).
- `empty`: hides seeded notifications and visits, so their empty states show.

## Next

- M4b: Android APK through a free EAS build (ask before creating any account), Portfolio Pack in `docs/portfolio/`.

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
- Body measurements are stored, so they can be edited and deleted. Seeded ones carry `seedOffsetDays` and are shown relative to today (newest today, weekly spacing kept), like the generated workout history. Editing a seeded one removes the offset, so it keeps its date; entries the member adds never move.
- Session duration counts each gap between actions as at most 3 hours. Actions that count: logging a set and the rest timer controls. Finishing counts the last gap the same way.
- Membership status is derived from its dates on every read. Renewing an active membership starts the new period the day after the current end and applies the chosen plan; an expired one restarts today. A visitor returning more than the remaining days later sees an expired membership, which is a valid state of the demo and ends with a renewal.
- The checkout is a full screen, not a sheet, so the keyboard never covers the fields.
- `?demo=error` makes reads fail, so the checkout cannot even open; the checkout failure path is `?demo=payfail` and the declined test card.
- Own QR encoder instead of a dependency: about 350 lines, verified against recorded matrices that an independent decoder (OpenCV) reads back, and against the published error correction vector. No new package, nothing that can break Expo Go or web.
- Notification text is stored as data (kind, class name, weekday, time) and written when shown, so a language switch updates the whole inbox.
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
