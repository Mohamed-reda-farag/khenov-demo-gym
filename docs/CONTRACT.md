# KHENOV demo contract

This is the working contract for every KHENOV portfolio demo app. It is copied here verbatim from the Team Leader's brief and must be kept in the repo.

## What we are building

A DEMO, not a production system. Its job is to win clients by showing:

1. Very smooth UX (fast, clear flows, no dead ends).
2. Strong, comfortable, polished interfaces.
3. Range of skills (one desktop app, one mobile app, one website).
4. A COMPLETE personal experience: the visitor can run a full realistic journey from start to finish and their actions persist locally.

Save effort on backend/database: there is NO real backend. Spend that effort on UX and UI quality.

## Environment rules

- Work happens inside a claude.ai chat with a sandbox. The user has a local machine, an empty GitHub repo, Node LTS and git.
- Anything needing manual action (creating files, running commands, copying zips, commits, installing tools, creating accounts) must be requested from the user as clear numbered step-by-step instructions. Never assume they did it. Ask them to paste exact terminal errors.
- Deliver each milestone as ONE zip of the full source (exclude node_modules, build outputs). Tell the user exactly how to extract it into the repo, install, run, test, and which git commit message to use.
- FREE tools only. Never require payment, a card, or a subscription. If something might need one, stop and ask.
- Do not add features beyond the brief. Do not expand scope.

## Honesty

- All data is fictional. Show a small, tasteful "Demo by KHENOV" badge and a "Reset demo" action.
- No fake client names, testimonials, or metrics presented as real. No medical/personal real data. No real auth or real payments: use "Continue as demo user" and a mock checkout.

## Tech rules (all projects)

- TypeScript strict, ESLint + Prettier, npm, no secrets, no dead code, no leftover TODOs.
- Standalone repo, no shared packages.
- Folder convention inside src/:
  - data/seed/ (typed fictional seed data)
  - data/repository/ (interfaces + local implementations; UI NEVER touches storage directly)
  - lib/demo/ (the demo kit, below)
  - i18n/ (ar.json, en.json)
  - theme/ (design tokens)
  - features/<feature>/ (screens + components + hooks of one feature)
  - components/ui/ (shared primitives)
- Demo kit (implemented in lib/demo/):
  - storage wrapper with namespace `khenov-demo:<app>:v<SEED_VERSION>` and safe try/catch
  - `delay(min=200,max=600)` used by repositories to simulate network
  - `resetDemo()` clears namespace and reseeds, with a confirm dialog
  - seed versioning: bumping SEED_VERSION reseeds automatically
  - optional `?demo=fast` style switch to disable delays for recording videos

## Design system rules

- Define tokens first (color, 8pt spacing, radius, typography scale, shadow, motion durations). Use only tokens. Each app has its own visual identity fitting its sector, but the same craftsmanship level.
- Every screen designs ALL states: loading (skeletons), empty, error, success. Disabled/hover/active/focus visible.
- Core task in 3 interactions or less. Confirmations, undo where destructive, optimistic updates.
- No Lorem ipsum, no generic stock look, no placeholder boxes. Realistic Arabic and English copy.
- Bilingual AR/EN with correct RTL/LTR, mirrored layouts and directional icons. Default language Arabic, switchable at any time. Localize numbers, dates, currency (EGP). Never animate Arabic letter by letter.
- Animate only transform/opacity, short durations, respect reduced-motion. Accessibility: contrast, keyboard/screen-reader basics, labels, touch targets 44px+.
- Performance: lazy-load heavy things, optimized images, smooth on mid-range devices.

## Process

Work in milestones. At the end of each milestone STOP and send this report:

REPORT

1. Milestone and status
2. What was built (short)
3. File tree of what changed
4. How to run and test (exact commands)
5. Decisions taken and why
6. Manual steps needed from the user
7. Known issues / risks
8. Quality-gate checklist results (states, RTL, motion, a11y, journey)
9. Proposed next milestone

Also update `PROJECT_STATE.md` in the repo root (done / next / decisions / how to run) on every milestone and keep this contract in `docs/CONTRACT.md`. Do not start the next milestone until the Team Leader's new order arrives via the user.
