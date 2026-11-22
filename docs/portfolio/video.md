# 30 second video

Portrait phone screen recording, **muted**, **under 4 MB**, MP4 H.264. Name: `media/nabd-gym-demo-30s.mp4`. Arabic, dark.

## Shot list

| Time         | On screen     | Action                                                                                                                                  | On-screen text (AR / EN)                                                    |
| ------------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 0:00 to 0:03 | Home          | The app is already open on Home. Hold still for one second, then start.                                                                 | نبض: تطبيق تجريبي لصالة رياضية / Nabd: a demo gym app                       |
| 0:03 to 0:10 | Classes       | Tap Classes, pick a day, open a class marked **متاحة**, tap **احجز مكانك**. The booking toast appears.                                  | احجز حصتك في لمسات / Book a class in a few taps                             |
| 0:10 to 0:19 | Workout       | Tap Workout, open **قوة الجزء العلوي**, tap **ابدأ الجلسة**, tap **إتمام الجولة 1**. The rest timer starts; let it count for 3 seconds. | مؤقت الراحة يستمر حتى بعد إعادة التشغيل / The rest timer survives a restart |
| 0:19 to 0:24 | Progress      | Tap Progress, let the charts draw, tap one point on the line to show its tooltip.                                                       | تقدّمك في رسوم واضحة / Your progress in clear charts                         |
| 0:24 to 0:28 | Check-in pass | Back to Home, tap **تسجيل الحضور**, the QR code shows, tap **محاكاة المسح**. The toast appears.                                         | بطاقة دخول بـ QR / A QR check-in pass                                       |
| 0:28 to 0:30 | End card      | Plain charcoal card, made in the editor.                                                                                                | Demo by KHENOV · بيانات وهمية / Demo by KHENOV · fictional data             |

Show one language per text block, or both stacked (Arabic above English). Use Changa for the text and Readex Pro for the small line, white on charcoal with the yellow `#FFD21F` for the key word. Keep text 80 px away from the edges. Never write or show claims about clients, users or results: the end card says Demo and fictional data.

## Record on an Android phone (free built-in tools)

1. Install the APK or open the app in Expo Go. Reset the demo (Profile, **إعادة ضبط العرض**) and go to Home.
2. Do Not Disturb on, battery above 50%, Wi-Fi on, notifications cleared.
3. Optional: Settings, Developer options, **Show taps** on, so viewers see the touches. Turn it off afterwards.
4. Pull down the quick settings and tap **Screen recorder** (Android 11 and newer, and Samsung One UI). Choose **No sound** and start.
5. Rehearse the whole sequence twice before recording. Record the full run slowly in one take, about 45 to 60 seconds; the editor shortens it.
6. Stop with the red recording pill or the quick setting. Copy the file to the PC (USB, Nearby Share or Google Photos).

## Edit

Free options: Clipchamp (built into Windows 11) or DaVinci Resolve (free edition). Checklist:

- [ ] Project is portrait, 1080 x 1920 or 1080 x 2400, 30 fps or lower.
- [ ] Cut the start and the waiting. Total length is exactly 30 seconds or less.
- [ ] Speed up waiting moments (a loading skeleton, the rest timer) to about 1.5x. Never speed up the taps themselves.
- [ ] Add the on-screen text from the table. Arabic letters must be connected and read right to left; if they look broken, change the font to Readex Pro or Changa.
- [ ] Add the end card for the last 2 seconds.
- [ ] No audio track and no music. Export MP4 at 1080 wide, then compress (below).
- [ ] Watch it on a phone: the text is readable and no real name, number or notification shows.

## Compress to under 4 MB

Needs ffmpeg (`winget install Gyan.FFmpeg`, then a new PowerShell window). In the folder with the exported file:

```powershell
ffmpeg -y -i export.mp4 -t 30 -an -vf "scale=720:-2,fps=24" -c:v libx264 -profile:v main -pix_fmt yuv420p -crf 30 -preset slow -maxrate 1000k -bufsize 2000k -movflags +faststart nabd-gym-demo-30s.mp4
```

`-an` removes any audio, `-t 30` stops at 30 seconds, and `-movflags +faststart` lets it start playing before it has fully downloaded. Check the size: `(Get-Item nabd-gym-demo-30s.mp4).Length / 1MB` should be under 4. If it is larger, raise `-crf` to 32. If the text looks soft, lower it to 27 and the size limit still usually holds for a screen recording.
