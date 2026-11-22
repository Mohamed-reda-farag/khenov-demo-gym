# Android APK (free EAS build)

The APK is the app as a normal installed Android app, without Expo Go. It is built on Expo's servers with EAS Build, using the `preview` profile in `eas.json` (internal distribution, APK file).

## What the free plan gives

- A free Expo account, no payment method. Sign up with an email or GitHub.
- 15 Android builds a month on the Free plan, in a low-priority queue. At busy times a build can wait 90 minutes or more before it starts. A Free plan build is stopped if it runs longer than 45 minutes (this app builds well inside that).
- If the monthly builds run out, new builds wait until the 1st of the next month. Nothing is charged on the Free plan. If any screen asks for a card or offers a paid plan, stop and skip it.

## Steps (Windows PowerShell)

Nothing is installed globally: `npx eas-cli@latest` runs the tool when needed.

1. Make sure everything is committed: `git status` shows nothing to commit.
2. Check the project: `npx expo-doctor`
3. Create the free account at expo.dev/signup, then sign in: `npx eas-cli@latest login`
4. Link the project: `npx eas-cli@latest init`. Answer yes to creating the project. This adds `extra.eas.projectId` (and `owner`) to `app.json`.
5. Build: `npx eas-cli@latest build --platform android --profile preview`. Answer yes when it offers to generate an Android keystore (EAS keeps it for you).
6. Wait. The terminal prints a link to the build page; the build finishes there with an **Install** QR code and a download link for the `.apk`.
7. Commit the `app.json` change: `git add app.json` then `git commit -m "chore: link EAS project"`.

## Install on the phone

Open the build page link on the Android phone and download the APK, then open it. Android asks to allow installing from this source (Chrome or Files), allow it. Google Play Protect may say the app is from an unknown developer, which is expected for an APK outside the store; choose **Install anyway**.

## Sharing the APK

EAS download links can expire. For a link that lasts, upload the `.apk` to a GitHub Release of this repository (free) and use that link in the portfolio card.

## If EAS is not an option

- **Expo Go and the web demo only.** Nothing else is needed; this is the path the project was developed on.
- **Local build on Windows.** `eas build --local` does not run on Windows. The other way is `npx expo prebuild -p android`, then building in Android Studio (JDK 17 and the Android SDK, several GB). The result is signed with a debug key, so it is fine for a demo but not for a store. Only do this if EAS is blocked.

## Before each new build

Raise `version` in `app.json` for a new release. EAS raises the Android version code by itself (`appVersionSource` is `remote`).
