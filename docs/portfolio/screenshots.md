# Screenshots (6 shots)

Arabic and dark are the app's defaults, so shots 1 to 5 are in Arabic, dark. Shot 6 is English, light, to show the range. All are portrait phone screens.

## Set up the web build at phone size

1. Run the app on the web: `npm run web` (or open the hosted demo when it exists). Add `?demo=fast` to the address: `http://localhost:8081/?demo=fast`.
2. In Chrome press F12, then Ctrl+Shift+M (device toolbar). Choose **Responsive**, size **412 x 915**. In the three-dot menu of the toolbar choose **Add device pixel ratio**, then set the new field to **2.625**.
3. Capture with the toolbar's three-dot menu, **Capture screenshot** (it saves the visible screen, about 1081 x 2402). Save as PNG with the names below.
4. Start every session clean: Profile (**حسابي**), **إعادة ضبط العرض** (Reset demo) (or clear site data in DevTools, Application tab).

## The shots, in the order to take them

After Reset demo: go through the three welcome slides, then tap **المتابعة كعضو تجريبي**. Wait until the skeletons are gone before each capture.

| #   | File                | Screen and what to do                                                                                                                                                                                                         |
| --- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `01-home.png`       | Home, right after login. The next class card, the streak and the quick actions are visible. No scrolling.                                                                                                                     |
| 2   | `02-classes.png`    | Classes tab. Pick a day with several classes, open one marked **متاحة** (Open), tap **احجز مكانك**, go back. Capture the list with the **محجوز** (Booked) badge showing.                                                      |
| 3   | `03-workout.png`    | Workout tab, open **قوة الجزء العلوي** (Upper Body Power), tap **ابدأ الجلسة**, tap **إتمام الجولة 1** (Complete set 1, the first set button). Wait about 10 seconds and capture with the rest timer counting.                |
| 4   | `04-progress.png`   | Progress tab. Scroll so the weight line chart and the volume bars are both visible. Tap a point on the line so its tooltip shows, then capture.                                                                               |
| 5   | `05-pass.png`       | Home, tap **تسجيل الحضور** (Check-in pass). When the QR code shows, tap **محاكاة المسح** (Simulate scan). Wait for the toast to fade, then capture: QR code, the status chip and the demo note are in view.                   |
| 6   | `06-membership.png` | Profile (**حسابي**): set **المظهر** (Appearance) to **فاتح** (Light) and **اللغة** (Language) to **English**. Open Membership, select the **Annual** plan card. Capture the plan picker. Then switch back to Arabic and Dark. |

Keep the app's own "Demo" wording visible where it appears (the demo badge on Profile). Do not edit the screenshots: no retouching, no added numbers.

## Android screenshots (manual)

Use these to check that the phone matches the web captures, or instead of them.

1. Install the APK (see [../ANDROID_BUILD.md](../ANDROID_BUILD.md)) or open the app in Expo Go.
2. Turn on Do Not Disturb, charge the phone above 50% and connect to Wi-Fi so the status bar is calm.
3. Follow the same table. Take each capture with Power + Volume down (some phones use Power + Home or a swipe gesture).
4. Move the files to the PC with a USB cable, Nearby Share or Google Photos. Android captures are usually 1080 x 2400.

## Convert to WebP

Needs ffmpeg once: `winget install Gyan.FFmpeg`, then a new PowerShell window. In the folder with the PNG files:

```powershell
$names = @{ "01-home"="nabd-gym-01-home"; "02-classes"="nabd-gym-02-classes"; "03-workout"="nabd-gym-03-workout"; "04-progress"="nabd-gym-04-progress"; "05-pass"="nabd-gym-05-pass"; "06-membership"="nabd-gym-06-membership" }
foreach ($key in $names.Keys) { ffmpeg -y -i "$key.png" -c:v libwebp -quality 85 "$($names[$key]).webp" }
```

Each file should be under about 250 KB. Put the results in `docs/portfolio/media/` and keep the PNG files out of the repository.
