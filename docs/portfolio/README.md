# Portfolio Pack (phone-focused)

Everything needed to present **Nabd Gym** in the KHENOV portfolio as a **Demo**: fictional data, no client, no live product. Order of work:

1. Build the media: [screenshots](screenshots.md) first, then the [cover](cover.md), then the [video](video.md). Save the final files in `media/` with the names below.
2. Copy the text from [summary.md](summary.md).
3. Fill the two links in [card.json](card.json) and hand the file over.

| File        | Name in `media/`                                         | Spec                           |
| ----------- | -------------------------------------------------------- | ------------------------------ |
| Cover       | `nabd-gym-cover.webp`                                    | 1600 x 1000, WebP              |
| Screenshots | `nabd-gym-01-home.webp` to `nabd-gym-06-membership.webp` | about 1080 x 2400, WebP        |
| Video       | `nabd-gym-demo-30s.mp4`                                  | 30 s, muted, H.264, under 4 MB |

Rules for everything in this pack:

- Say "Demo" wherever the project is named or shown. The app itself shows "Demo by KHENOV".
- No client names, testimonials, download counts or any other number presented as real. Every number in the app is fictional.
- Do not add the KHENOV logo unless you have the official files; none are in this repository.

About `card.json`: the field names follow the list in the brief (slug, type, titles and summaries in AR/EN, tags, links, media). If KHENOV's project model names them differently, rename the keys; the values stay the same. Tags are written as Arabic and English pairs; flatten them if the model takes one list.

The `.webp` and `.mp4` files are small enough to commit in `media/`. Do not commit the raw recording.
