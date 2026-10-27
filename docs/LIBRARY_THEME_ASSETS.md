# Library theme

Selectable `library` skin. The default remains Viking. Uses the existing dashboard layout, including Focus / Start / Break in one action row. The timer scales its wide frame on mobile; it intentionally has no separate square asset. Palatino is the UI font; locally bundled EB Garamond is the timer display font. This skin has no custom cursor or ambience assets.

The profile control has no background plate in any theme. Library mode controls use borderless quill / cup icons with an underline and brighter text for the active mode; `aria-pressed` exposes the state to assistive technology. Start preserves the source plate's 3:1 proportions. Stats use internal padding rather than collapsing child margins so both analytics panels align.

## Asset source and export

User reference: `ChatGPT Image May 24, 2026, 06_03_13 PM.png`.

The built-in `image_gen` tool edited this reference into four clean runtime assets, removing baked-in interface content. Exported with Sharp as WebP at quality 88, alpha quality 100. Original generated PNGs remain outside the runtime asset directory. Four small SVG icons were authored directly to fit the brass palette and the reference's quill, coffee, compass and gear motifs.

| Runtime file under `public/assets/Library/` | Size | Use |
| --- | --- | --- |
| `background.webp` | 1672 × 941 | Library room with interface removed |
| `timer-panel.webp` | 1536 × 640 | Transparent carved frame, blank parchment center |
| `parchment.webp` | 1000 × 437 | Heatmap and stats, nine-slice corners |
| `wood-plate.webp` | 900 × 300 | Action and toolbar plates; modal texture |
| `quill.svg`, `coffee.svg`, `compass.svg`, `settings.svg` | 64 × 64 | Theme-owned vector icons |

The heatmap and stats retain distinct semantic asset slots while sharing a parchment source. Nine-slice rendering preserves the corners at different proportions.

## Font and sound

`fonts/EBGaramond-Variable.ttf` comes from [Google Fonts' EB Garamond](https://github.com/google/fonts/tree/main/ofl/ebgaramond), under the bundled `fonts/OFL.txt` license. The font is loaded locally, with no runtime font-service requests. Timer digits use lining numerals and the existing fixed-width digit slots.

Control sounds use real Yamaha C5 recordings from Alexander Holm's [Salamander Grand Piano V2](https://github.com/Tonejs/audio/tree/master/salamander), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Credit, source links and modifications ship in `audio/ATTRIBUTION.txt`. They are trimmed and softened, with short attack fades and longer release fades. Prepare the stereo 44.1 kHz PCM files with `node scripts/prepare-library-piano.mjs <C4.mp3> <A3.mp3>`; original full-length samples stay outside `public/assets`.

- `audio/grand-piano-c4.wav`: 1.05 s middle-C grand piano cue for Start / Pause.
- `audio/grand-piano-a3.wav`: 0.95 s lower-A grand piano cue for Focus / Break.
- `audio/brass-tap.wav`: 0.16 s toolbar tap.
- `audio/desk-bell.wav`: 3.8 s two-note brass bell at timer completion.

These use the existing alarm/UI-sound preferences and volume controls; focus ambience remains absent.

The original mono toolbar tap and completion bell remain reproducibly synthesized by `node scripts/generate-library-audio.mjs`.

## Generation prompts

All four calls used the user reference as `referenced_image_paths`. Background transparency was false for the room and true for the other three assets.

### Background

Use case: precise-object-edit. Asset type: full-page background for a functioning Pomodoro web app, landscape 16:9. Edit target: attached reference image. Extract/reconstruct ONLY the antique library environment shown in this exact reference, preserving its photographic painterly detail, dark walnut bookshelves, arched sunlit window at left, brass desk lamp, books, writing desk, feather quill and lantern. REMOVE ALL floating user interface artwork: the central ornate timer frame and numbers, all top buttons and level bar, Start button and mode buttons, all parchment statistics/calendar panels. Seamlessly reconstruct the library shelves and desk behind every removed UI item. Center area is dark, calm bookshelf space where real HTML UI will sit. Preserve the room's warm amber light, rich natural wood textures and perspective. No floating panels, no UI, no numbers, no labels, no new text. This is the reference room with its interface completely removed, not a redesign.

### Timer frame

Use case: background-extraction. Asset type: production UI timer panel with transparent exterior. Edit target: attached reference. Isolate ONLY the large central ornate carved walnut and antique brass/gold rectangular timer frame, with its cream parchment center, as seen in the image. Remove the 24:53 digits completely, reconstruct clean blank lightly textured parchment. Keep the reference's wood grain, sculpted acanthus/scroll carvings, gold highlights and symmetrical crest. Frame is front-facing, horizontal, 2.4:1 aspect, fills canvas with minimal transparent padding. Spacious center blank parchment region suitable for large real HTML timer digits, no text and no numbers anywhere. Preserve natural irregular silhouette and genuinely transparent background outside the frame. Nothing else from the scene. Deliver single isolated frame only, not a sheet.

### Parchment

Use case: background-extraction. Asset type: blank parchment analytics panel, transparent exterior. Edit target: attached reference. Isolate the bottom-left cream aged parchment heatmap panel in the reference. Remove EVERY bit of content: all calendar squares, month/day labels, legend, statistics, numbers, all writing. Reconstruct clean even warm cream parchment texture in the blank center. Preserve the fine sepia decorative corner ornaments, thin double-line border, thick worn paper edges and subtly darkened rolled edges. Front facing flat rectangular sheet about 2.3:1 aspect ratio, minimal transparent margin. Center is pale readable parchment, light enough for dark brown HTML text. Do not include any wood background, interface content, lines dividing the center, or other objects. Transparent exterior, one isolated panel only.

### Wood plate

Use case: background-extraction. Asset type: blank wooden action-button plate for a website. Edit target: reference image. Extract ONLY the rectangular START button plate beneath the timer. Remove START letters completely and reconstruct the dark walnut wood grain under them. Keep the exact brass/gold inset border and antique small corner scroll decorations, carved beveled wood rim, rich dark brown grain with amber highlights. Front-facing perfectly horizontal rectangle approximately 3:1 aspect ratio. Blank wood center. Minimal transparent margin around natural silhouette. No words, letters, numbers, icons, UI content or other objects. Genuinely transparent exterior. A single button plate only.
