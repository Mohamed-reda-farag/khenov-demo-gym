# Quality notes (M3c)

How each screen was checked, and what to know when presenting the demo. "Checked" means a code path exists for the state and the repositories return it under the switch (tests in `src/data/repository/__tests__/flags.test.ts`); it was not judged by eye on a device.

## Demo switches

Web: `?demo=empty,error,expired,expiring,payfail,fast` (comma list). Native (PowerShell): `$env:EXPO_PUBLIC_DEMO="empty"; npx expo start -c`.

| Switch                | Effect                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `error`               | Every data read fails, so each screen shows its error state with Retry. The session is spared so the app opens.   |
| `empty`               | No scheduled classes, no bookings, no generated history, no seeded measurements, badges, visits or notifications. |
| `expired`, `expiring` | Seeded membership ended 5 days ago, or ends in 7 days.                                                            |
| `payfail`             | Payment fails after processing. Test card `4000 0000 0000 0002` is declined, `4242 4242 4242 4242` pays.          |
| `fast`                | No simulated delays.                                                                                              |

## Empty and error states, per screen

Error (`?demo=error`): Home, Classes, Class details, Workout, Plan details, Exercise library, Exercise details, Active session, Summary, Progress, Profile, Membership, Checkout, Pass, Notifications, Edit profile. All show the shared error state with Retry (or a not-found state for a missing id).

Empty (`?demo=empty`): Home (no next class, no streak), Classes (empty day), Workout (no recent sessions), Progress (no chart data, no records, badges locked, measurements empty state), Pass (no visits), Notifications (all caught up). The exercise library has no empty switch on purpose (an empty library is not a real situation); its "no results" state shows when searching for nonsense. Membership, Checkout, Profile and Edit profile always have data, so they have error and loading states only.

## RTL audit

Every screen was read for physical directions. Result: no `left`/`right`/`marginLeft`/`paddingRight`/`textAlign: 'left'|'right'`/`row-reverse` remains in a layout; the only physical values are:

- Symmetrical top corner radii on sheets and the tab bar (same on both sides).
- Chart labels and tooltips: absolute positions computed from the same direction-aware layout as the drawing (time runs in the reading direction).
- Directional translations that are multiplied by the direction sign: onboarding swipe, rest timer fill, toggle thumb, celebration burst.

Fixed in M3c: numeric fields (card number, expiry, security code, phone, English name) keep left-to-right writing but now sit on the start edge in Arabic, like their label. The QR code is forced left-to-right and never mirrored.

Direction follows the app language on the root view and bottom sheets. Native stack transitions follow the OS, not the app language (no restart design): they are slide-from-bottom for the sheets of this app.

## Accessibility

- Screen titles (`h1`) are headings by default; top-bar titles set the role explicitly.
- Buttons, switches, radios and tabs carry roles and `selected`/`checked`/`disabled` state. State is never colour alone: switches say On/Off, status chips have an icon and a word, unread notifications say New, plan selection has a filled radio.
- Charts expose a spoken summary on the SVG (`aria-label`).
- Reduced motion: every animated component checks it. Animations use transform and opacity only, with durations from `theme/tokens`.
- Touch targets are 44dp or more. Exception: the seven day cells of the class week fit the screen width, so on a 320dp screen each is about 41dp wide (44dp high). Making them scroll would hide days, so the exception is kept.

Contrast (WCAG), lowest pairs in each theme:

- Text: light, warning on surfaceAlt 4.61; dark, muted on surfaceAlt 4.70; light, danger on surfaceAlt 4.78. All text pairs are 4.5 or more.
- Controls (3:1): input and switch borders use the muted text colour (4.7 or more). Card borders (1.2 to 1.5) are decoration, the card content identifies them.

## Performance

- Fonts: only the five weights in use are bundled (13 files before). Web assets 1.12 MB to 0.48 MB, Android assets 1.11 MB to 0.46 MB.
- JS is unchanged: web 2.76 MB minified (0.68 MB gzip), Android Hermes bytecode 4.72 MB. Most of it is expo-router, reanimated, gesture handler and react-native-web.
- Web is already split per route. On native, route modules run on first visit.
- Lists: `FlatList` with tuned render windows on classes and library, memoized rows, charts and day selector, memoized notification rows.
