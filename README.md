# Tala's Study Corner 🌿

A calm little **garden** for studying — a companion gift project.
Plain HTML / CSS / JavaScript. No build step. Just open `index.html`.

> Kept entirely separate from any work project. Its own repo.

## The main view is a garden

When she opens it she sees a small garden — soft sky, sun, drifting clouds,
birds, two trees — with just three things to use:

- **A growing plant** — grows as she completes to-do tasks; it regresses toward
  but never below a single leaf, and never dies.
- **A to-do signboard** — add/check/delete tasks (this is what grows the plant).
- **A basket** — where notes from you land. A badge stays until she opens it.

Everything else lives in the **slide-out menu** (tap the **signpost**,
bottom-left): Focus timer, Notes, Streak, Countdown, Mood, Breathe,
Look & feel (dark mode + garden scenes), and Sharing & privacy.

## Make it yours

Edit **`config.js`** (plain text):
- `names` — her name (the "Shatoora" nickname has been removed; set any nickname you like)
- `quotes`, `greetings` — the warm messages
- `pomodoro`, `backgrounds` — timer defaults, garden scene gradients

## The basket & live note delivery (§5)

You leave notes from a **private page** (`panel.html`). When you post one, a
**bird flies across her screen and drops it into the basket** — live, while her
page is open — with a banner and a badge that stays until she reads it.
Opening the basket shows the current note (first 24h) plus the full archive.

### Making delivery work across devices (one-time setup)

Live cross-device delivery needs a tiny shared store both pages can reach.
The code is already wired for **Firebase Realtime Database** (REST, no SDK):

1. Create a free Firebase project → add a **Realtime Database** (test mode is fine for a personal gift).
2. Copy its URL, e.g. `https://your-project-default-rtdb.firebaseio.com`.
3. Paste it into `config.js` → `cloud.notesUrl`.

That's it — her page polls every few seconds (`cloud.pollSeconds`) and notes you
post from `panel.html` appear in her basket on any device.

**Until you add a URL**, delivery runs **same-browser** (works live across two
tabs/windows on one machine) so you can try it immediately. Her study data
(plant, to-dos, timer, etc.) always stays local in her browser regardless.

## The private panel (`panel.html`)

A separate, unlisted page (not linked from her garden):
- **Leave her a note 💌** — posts to the basket (cloud or local per above).
- **Her activity (§6)** — consent-gated: shows status, tasks, notes, and a weekly
  progress table **only while her current answer is "yes."** Weeks she kept private
  show as gaps, never estimated. Optionally gate the page with `config.panel.passcode`.

## Deploy to GitHub Pages (free)

1. Create a repo on a **personal** account (not a work one).
2. Push these files; Settings → Pages → Source: `main` / root.
3. The Firebase URL above makes notes deliver to her wherever she opens the page.

## Privacy

Her study data lives only in her browser (`localStorage`). The only shared piece
is the note channel (and, if she opts in, the §6 activity snapshot) — gated by her
visible, reversible consent.
