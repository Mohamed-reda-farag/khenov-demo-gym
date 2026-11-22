# Cover image

**1600 x 1000 px, WebP, under 200 KB.** Name: `media/nabd-gym-cover.webp`.

## What to show

Three phone screens side by side on the app's charcoal background (`#0E1116`):

- Left: the active workout session with the rest timer (`03`).
- Center, larger: Home in Arabic, dark (`01`).
- Right: Progress with the charts (`04`).

Arabic dark screens only, so the cover reads as one identity. No device frames, no fake reflections, no text from the app that is cut off. The yellow accent comes from the app itself; do not add other colours.

## Safe margins

Keep everything important inside 80 px from every edge (the card may be cropped to a 16:10 or a 4:3 box). The layout below leaves 80 px above and below the center phone and 190 px at the sides. If the portfolio card puts a title over the lower third, move the screens up by editing the `y` values.

## Produce it from the screenshots

1. Make the three screenshots from [screenshots.md](screenshots.md) and keep the PNG files (shots `01`, `03`, `04`).
2. Install ffmpeg once (free): `winget install Gyan.FFmpeg`, then open a new PowerShell window.
3. In the folder with the PNG files:

```powershell
ffmpeg -y -f lavfi -i "color=c=0x0E1116:s=1600x1000" -i 03-workout.png -i 01-home.png -i 04-progress.png `
  -filter_complex "[1:v]scale=-1:760[l];[2:v]scale=-1:840[c];[3:v]scale=-1:760[r];[0:v][l]overlay=x=190:y=120[t1];[t1][c]overlay=x=(W-w)/2:y=80[t2];[t2][r]overlay=x=W-w-190:y=120" `
  -frames:v 1 -c:v libwebp -quality 88 nabd-gym-cover.webp
```

4. Open the result and check it. It should be 1600 x 1000 and under 200 KB; if it is larger, lower `-quality` to 80.

If a title or the "Demo" label is wanted on the cover, add it in a free design tool (Canva or Figma) on top of this image, using the app fonts (Changa for the title, Readex Pro for the rest) and the word **Demo** next to the name. Check that the Arabic letters are connected.
