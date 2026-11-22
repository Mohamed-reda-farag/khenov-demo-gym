# Nabd Gym · demo by KHENOV

Nabd Gym is a **demo** mobile app for a fictional gym, made by KHENOV as a portfolio piece. It shows a complete member journey in Arabic (default, right to left) and English. **Everything in it is fictional.** The member, trainers, classes, prices and numbers are invented, nothing is sent anywhere, there is no backend, no real login and no real payment.

- Live demo: _add the URL after the first deploy_ (see [Deploy the web demo](#deploy-the-web-demo))
- Android APK: _add the link after the build_ (planned for the next batch)

## The journey

Splash and 3 onboarding slides → **Continue as demo member** → Home → Classes (week schedule, filters, details, book, cancel, waitlist) → Workout (plans, active session with a rest timer that survives a restart, summary with records, exercise library) → Progress (charts, measurements, records, achievements) → Membership (renew with a mock checkout, check-in pass with a QR code) → Profile (language, theme, notifications, Reset demo).

Everything the visitor does is saved on the device, so a full run feels real.

## Run it

Needs Node 22.13 or newer (Node 24 works) and npm.

```powershell
npm install
npx expo start
```

- **Android:** install Expo Go (the version that supports SDK 58), scan the QR code.
- **Web:** press `w` in the terminal, or `npm run web`.

| Script              | What it does                                               |
| ------------------- | ---------------------------------------------------------- |
| `npm run check`     | typecheck, lint, format check and tests (the quality gate) |
| `npm run build:web` | static web build into `dist/`                              |
| `npm run format`    | apply Prettier                                             |

## Deploy the web demo

`npm run build:web` writes a static site to `dist/`. It is a single page app, so the host must answer any unknown address with `index.html`. The demo is served from the root of its domain (no base path).

**Recommended host: Cloudflare Pages** (free plan). When a site has no `404.html`, Pages treats it as a single page app and serves `index.html` for unknown addresses, which is what this demo needs. It also reads `public/_headers` for caching and `noindex`, and serves the site from the root of its domain. Free plan limits: 500 builds a month, 20,000 files and 25 MiB per file; this demo is about 55 files. No payment method is needed for the free plan, so stop if one is asked for. Steps:

1. Sign in at dash.cloudflare.com (a free account) and open Workers & Pages.
2. Create a Pages project and connect this GitHub repository.
3. Build command: `npm run build:web`. Output directory: `dist`.
4. Environment variable: `NODE_VERSION` = `22`.
5. Deploy. The address looks like `https://<project>.pages.dev`.

No Git? Run `npm run build:web` locally, then create a Pages project with **Upload assets** and drop the `dist` folder.

Other hosts work too. Netlify needs a file `public/_redirects` with `/* /index.html 200`. GitHub Pages serves a project site under `/<repo>/`, which needs `experiments.baseUrl` in `app.json` and a copy of `index.html` as `404.html`, so it is not recommended.

The build keeps the demo out of search results: `<meta name="robots">`, `robots.txt` and an `X-Robots-Tag` header. Remove them in `public/` when you want it indexed.

`npm run build:web` also moves Expo's `assets/node_modules` folder to `assets/vendor`, because some hosts and upload tools silently skip folders named `node_modules`, which would remove the fonts.

## Demo switches

For recording and for reaching states that are hard to reach by hand. On the web add `?demo=` to the address, with a comma list, for example `/?demo=fast,expired`.

| Switch     | Effect                                                             |
| ---------- | ------------------------------------------------------------------ |
| `fast`     | no simulated network delays                                        |
| `error`    | every data read fails, so each screen shows its error state        |
| `empty`    | no classes, history, measurements, badges, visits or notifications |
| `expired`  | the membership ended 5 days ago                                    |
| `expiring` | the membership ends in 7 days                                      |
| `payfail`  | the payment fails after processing                                 |

On Android (Expo Go) use an environment variable and clear the cache:

```powershell
$env:EXPO_PUBLIC_DEMO="expired,fast"; npx expo start -c
```

Without PowerShell: `EXPO_PUBLIC_DEMO=expired,fast npx expo start -c`.

**Test cards** (the checkout is a mock, never enter real card data): `4242 4242 4242 4242` pays, `4000 0000 0000 0002` is declined. Any future expiry and any 3 digits. The wallet option accepts any Egyptian mobile number such as `01012345678`.

## Reset demo

Profile → Reset demo asks for confirmation, clears everything the visitor did (bookings, workouts, measurements, membership, notifications) and loads the original data again. Language and theme are kept. All data lives under the storage key `khenov-demo:gym:v<SEED_VERSION>`; raising `SEED_VERSION` in `src/lib/demo/config.ts` reseeds every visitor automatically.

## How it is built

- Expo SDK 58, React Native, Expo Router (typed routes off), TypeScript strict, Reanimated, Gesture Handler, SVG, i18next. Runs in Expo Go and as a web build with react-native-web.
- `src/data/seed`: typed fictional data. `src/data/rules`: pure business rules (booking and waitlist, rest timer, personal records, achievements, membership renewal, visits, notifications), covered by tests. `src/data/repository`: interfaces and local implementations; screens never touch storage. `src/lib/demo`: the demo kit (namespaced storage, simulated delay, reset, seed versioning, switches).
- **Dates are relative to today.** Class sessions, workout history, measurements, notifications and the membership period are generated when the app runs, so the demo looks alive whenever it is opened. A membership that the visitor renews has fixed dates and can really expire.
- The QR code on the check-in pass comes from a small encoder written for this project (`src/lib/qr`), checked against scan-verified reference matrices. Charts are drawn with react-native-svg, without a chart library.
- Design tokens in `src/theme`; Arabic and English strings in `src/i18n`.

More: `PROJECT_STATE.md` (status and decisions), `docs/CONTRACT.md` (project rules), `docs/QUALITY.md` (right-to-left, accessibility and performance checks, contrast ratios, bundle sizes).

## Accessibility and performance

Right-to-left layout follows the app language instantly on web and native. Touch targets are 44 dp or more (one documented exception for the seven day cells on a 320 dp screen). State is never shown by colour alone, animation uses transform and opacity only and respects reduced motion, and text contrast is 4.5:1 or better in both themes. Fonts are bundled per weight (5 files), routes are split on the web, and long lists are windowed. Numbers are in `docs/QUALITY.md`.

## Security note

`npm audit` reports 3 moderate findings, all one chain (`minimatch` through `@expo/fingerprint`, which belongs to Expo's build tooling). It does not ship in the app. The suggested fix downgrades Expo to SDK 52, so it is not applied; it is cleared by moving to a newer SDK when one is released.

## Credits

- Fonts: Changa and Readex Pro, SIL Open Font License 1.1 (through `@expo-google-fonts`).
- Icons: Lucide, ISC license.
- Libraries: Expo, React Native, Reanimated, Gesture Handler, react-native-svg, i18next and their dependencies, mostly MIT licensed (see `package.json`).
- The app icon and the pulse mark are drawn for this demo. The KHENOV logo is not included in this repository.
- "QR Code" is a registered trademark of DENSO WAVE INCORPORATED.

---

## بالعربي

**نبض (Nabd Gym)** تطبيق **تجريبي** لصالة رياضية وهمية، من تصميم KHENOV كعمل في معرض الأعمال. كل البيانات وهمية: العضو والمدربون والحصص والأسعار، ولا يوجد خادم ولا تسجيل دخول حقيقي ولا دفع حقيقي.

- **التشغيل:** `npm install` ثم `npx expo start`، وافتحه في Expo Go على أندرويد أو اضغط `w` للويب.
- **الرحلة:** شاشة الترحيب ← «تابع كعضو تجريبي» ← الرئيسية ← الحصص (حجز وإلغاء وقائمة انتظار) ← التمارين (جلسة نشطة ومؤقت راحة) ← التقدّم ← العضوية (تجديد بدفع تجريبي وبطاقة دخول بـ QR) ← الملف الشخصي.
- **بطاقات الاختبار:** `4242 4242 4242 4242` تنجح، و`4000 0000 0000 0002` تُرفض. لا تُدخل بيانات بطاقة حقيقية.
- **إعادة الضبط:** الملف الشخصي ← «إعادة ضبط العرض» تمسح ما فعله الزائر وتعيد البيانات الأصلية، مع بقاء اللغة والمظهر.
- **مفاتيح العرض:** على الويب أضف `?demo=expired` أو `?demo=empty` أو `?demo=error` وغيرها (الجدول أعلاه).
- الصفحة المنشورة لا تظهر في نتائج البحث عمدًا.
