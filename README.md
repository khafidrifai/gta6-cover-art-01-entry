# gta6-cover-art-01-entry

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/khafidrifai/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/khafidrifai/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice City Cover Maker — turn your own photos and a caption into GTA-style cover art: multi-panel poster layouts, a sunset or neon colour grade, heavy outlined lettering, and a one-click PNG export in the three common post sizes (1080×1080, 1080×1350, 1920×1080). Everything runs offline in the browser; photos stay on your machine.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — add photos (or use the two samples), pick a layout, grade and size, write the caption, drag a photo inside its panel to reposition it, and press Export PNG.

## How it works

- `app/src/cover.js` draws the whole cover — panels, grade, caption — on a canvas at any pixel size, so the preview and the exported PNG are the same drawing.
- `app/src/state.js` holds the cover's state: post size, panel layout, grade, caption, and one zoom-and-pan crop per panel.
- `app/src/main.js` wires the editor: file input and drag-and-drop, panel picking and dragging, the pickers, and the export.
- `app/src/shots.js` sets up fixed scenes (`?shot=cover` / `?shot=editor`) for the screenshots.
- The poster lettering is Noto Sans Black and Bold, bundled under `app/fonts/` under the SIL Open Font License (see `app/fonts/OFL.txt`). No Rockstar logo, wordmark, artwork, character or font is used anywhere — the lettering, layouts and grades are original.

## Layouts and grades

Six panel layouts: Solo, Duo side-by-side, Duo stacked, Trio with a big left panel, Trio with a big top panel, and Quad. Three colour grades wash over the photos — Sunset (warm orange into pink), Neon Nights (cyan and magenta), Vice Pink — or Original with no grade. The caption sits on a dark scrim at the top or bottom, in white, yellow, pink, cyan or black, at a size you choose; a long title shrinks itself until it fits the cover.

## Build it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` to the output and writes `dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=9gz3k7fj&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
