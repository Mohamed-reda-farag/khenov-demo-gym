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

## Next

- M1: Home (today's plan, next class, quick actions), Classes (schedule, filters, details, book/cancel, capacity, waitlist, confirmation), all states.
- Classes, Workout and Progress tabs are intentional "coming soon" shells until their milestones.

## Decisions

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
