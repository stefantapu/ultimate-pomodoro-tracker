# Theme Implementation Guide

This guide captures the theme decisions from the Viking theme planning/implementation session and should be used as the baseline for adding future visual themes.

## Context Snapshot

The app uses a typed skin system:

- `src/shared/skins/types.ts` defines the skin contract.
- `src/shared/skins/catalog.ts` registers each theme profile.
- `src/shared/skins/cssVars.ts` maps skin assets/tokens to CSS variables.
- `src/widgets/dashboard.css` imports ordered dashboard CSS shards.
- `DashboardLayout` applies `dashboard-shell dashboard-shell--{skinId}` and inline CSS variables from the active skin.

The current themes are:

- `warm`: default theme, red lava art, embers, custom Diablo cursors, current global alarm/click sounds.
- `neumorphism`: silent, art-light, CSS-drawn controls, no ambient effect.
- `viking`: selectable theme, warm-like layout proportions, Viking art, snow particles, custom cursors, distinct audio roles, Norse as the primary visible UI font, and non-italic Palatino Linotype as fallback plus the editable-text font.

Future themes should be additive. Do not alter existing theme visuals or behavior unless the task explicitly asks for a cross-theme refactor.

## Required Theme Assets

Place theme assets under:

```text
public/assets/{Theme Name}/
```

A full art-driven theme should provide:

- `Background.webp`: full-page background, usually 16:9 or wide cinematic.
- `Timer panel.webp`: desktop timer panel.
- `Timer panel square.webp`: mobile/square timer panel.
- `Start button.webp`
- `Reset Button.webp`
- `Focus button.webp`
- `Break button.webp`
- `Notes panel.webp`
- `heatmap panel.webp`
- `Stats panel.webp`
- `Dragon panel.webp`
- `Background of top buttons.webp`: shared toolbar button plate.
- `Statistics icon.webp`: history/analytics toolbar icon.
- `Theme icon.webp`
- `Settings icon.webp`
- `Login Logout icon.webp`
- Timer/control display font, usually under `Timer font/`.
- Optional cursor folder with at least:
  - default cursor
  - pointer/link cursor
  - text cursor
  - disabled/unavailable cursor
- Optional sound folder with:
  - alarm on timer finish
  - start/pause/reset click
  - focus/break click
  - toolbar click
  - focus ambience loop

If a theme is not fully art-driven, set missing assets to `null` in the catalog and make the theme CSS handle that intentionally.

## Skin Contract Rules

Add a new `SkinId` and full `SkinProfile`.

Each skin must define:

- `capabilities.effects.ambient`: `embers`, `snow`, or `null`.
- `capabilities.audio`: booleans for `alarm`, `primaryTimerControl`, `modeControl`, `toolbarClick`, and `focusAmbience`.
- `capabilities.visual`: booleans for timer art, toolbar art, and custom cursors.
- `assets`: every image/cursor key from `SKIN_IMAGE_ASSET_KEYS` and `SKIN_CURSOR_ASSET_KEYS`.
- `audio`: every key from `SKIN_AUDIO_ASSET_KEYS`.
- `focusAmbienceFadeInMs`: use `0` unless the theme ambience should fade in.
- `colors`, `typography`, and `layout`.

Use `buildImageAsset(path, { width, height })` for images. If filenames do not include `_w###_h###`, provide accurate fallback dimensions.

For warm-compatible art themes, reuse the warm layout values first:

- `timerPanelMaxWidth: "100%"`
- `timerPanelMinHeight: "220px"`
- `timerPanelOverlayOpacity` around `0.94` to `0.96`
- `actionButtonMinHeight: "4.2rem"`
- `squareButtonMinHeight: "4.2rem"`
- `panelRadius: "0.4rem"`
- `buttonRadius: "0.4rem"`
- `modalRadius: "0"`

## CSS Implementation Pattern

Create one theme CSS shard:

```text
src/widgets/styles/dashboard/90-theme-{theme-id}-dashboard.css
```

Import it from `src/widgets/dashboard.css` after existing theme shards unless cascade requirements say otherwise.

Use selectors scoped to:

```css
.dashboard-shell--{theme-id}
```

Do not edit warm/neumorphism selectors for a new theme except for shared contract plumbing such as root fallback variables or typed CSS variable mapping.

For warm-like art themes:

- Mirror warm panel sizing and inset behavior first.
- Use the theme-specific CSS file for color, glow, hover, active, icon, and text tuning.
- Keep text inside fixed art panels stable with explicit dimensions, aspect ratios, and inset values.
- Use role-specific classes for mode buttons:
  - `.top-controls__button--focus`
  - `.top-controls__button--break`
- Use toolbar role classes:
  - `.toolbar-icon-button--history`
  - `.toolbar-icon-button--theme`
  - `.toolbar-icon-button--settings`
  - `.toolbar-icon-button--exit`

## Modal, Loading, Popup, and Portal Surfaces

Dashboard-scoped selectors are not enough for every themed surface. Some UI renders through portals, global app states, or third-party containers, so each theme must cover both shell-scoped UI and portal-scoped UI.

Theme these surfaces when adding or changing a skin:

- Auth/login lock surface: `.auth-block--{skinId}`.
- Settings modal: `.settings-modal__overlay--{skinId}`.
- History/infographics modal: `.history-dashboard__overlay--{skinId}`.
- Theme picker modal: `.theme-picker-modal__overlay--{skinId}`.
- App loading screen: `.app-loading-state--{skinId}`.
- Toast popups: `body[data-dashboard-skin="{skinId}"] .forge-toast`.
- Lazy loading and fallback panels inside themed dashboard shells.
- Locked overlays, tooltips, and other temporary status surfaces.

Use `mapSkinToCssVariables(activeSkin)` on modal roots/fallback states where the component can receive inline styles. Keep `body[data-dashboard-skin="{skinId}"]` in sync for toast and portal content that cannot inherit from `.dashboard-shell--{skinId}`.

For Viking specifically:

- Modals, loading states, popups, and toast text use Norse unless the field is editable.
- Panels use a frosted dark stone/metal treatment with pale text and restrained glow.
- Inputs, login/password fields, textareas, and notepad content use non-italic Palatino Linotype for readability.
- Do not let shared warm/lava modal colors leak into Viking portal surfaces; Viking overrides live in `90-theme-viking-dashboard.css` after the shared modal styles.
- If a modal already looks visually correct, prefer typography, contrast, and state-text fixes over layout changes.

## Typography Rules

Decide the scope of decorative fonts per theme and document the exceptions.

For Viking, Norse (`VikingTimer`) is the primary font for visible UI text, including:

- timer counter
- Focus/Break, Start/Pause, and Reset buttons
- toolbar buttons and icon-button labels
- modal headings, labels, helper text, and button text
- loading, empty, locked, toast, popup, and status text
- heatmap/stat/level panel labels and values

Viking exceptions use non-italic Palatino Linotype:

- notes/notepad textarea content
- login and password inputs
- settings inputs and any other editable field
- heatmap and stats panel labels/values when Norse becomes too thin over textured stone
- dense freeform text where Norse hurts readability

Palatino Linotype is also the fallback after Norse in the Viking skin typography config. Do not use the italic Palatino variant for Viking UI unless a future task explicitly asks for it.

For future themes, decide whether the decorative font is:

- display-only
- timer/control-only
- global

Prefer timer/control-only unless readability is proven. If a theme uses a decorative font globally, define editable-text and dense-reading exceptions up front.

## Main Panel Text and Contrast Rules

Art-backed panels can make text hard to read even when the layout is correct. Start with text styling before changing spacing or panel geometry.

For fixed art panels:

- Adjust text color, weight, shadow, stroke, and font before changing panel layout.
- For image-backed buttons, remove default rectangular backgrounds and box-shadows that can create glassy squares behind the art.
- Heatmap/vendor SVG labels may need `paint-order: stroke fill`, a dark stroke, and stronger text color.
- Stats panels usually need brighter labels/values plus text-shadow because the stone texture varies in brightness.
- Notes/notepad content should preserve readable editing typography; for Viking that means non-italic Palatino Linotype.

Only change insets, spacing, or sizing when the task explicitly calls for it. In the Viking pass, the notes notepad was the explicit exception: its top and bottom inset were expanded because the selected textarea felt too small.

## Ambient Effects

Ambient particles are skin-configured, not hardcoded per theme.

Use:

```ts
effects: {
  ambient: {
    kind: "snow" | "embers",
    count,
    seed,
    colors,
    sizeRangePx,
    durationRangeSec,
    delayRangeSec,
    opacityRange,
    startXRangePercent,
    startYRangePercent,
    travelXRangeVw,
    travelYRangeSvh,
    driftRangeVw,
  },
}
```

Guidelines:

- Embers should rise vertically with warm colors.
- Snow/wind should travel left-to-right with subtle vertical drift.
- Keep counts reasonable; Viking uses `120` particles.
- Respect `prefers-reduced-motion`; the shared CSS hides ambient particles for reduced motion.

## Audio Rules

Audio roles are split:

- `alarm`: session completion sound.
- `primaryTimerControl`: Start/Pause/Reset.
- `modeControl`: Focus/Break switching.
- `toolbarClick`: history/theme/settings/login/logout toolbar buttons.
- `focusAmbience`: looping ambience.

Focus ambience must only play while:

- active mode is `focus`
- timer status is `running`
- ambience is enabled
- ambience file is available
- ambience volume is greater than zero

Use `focusAmbienceFadeInMs` for loops that start abruptly. The fade applies only when playback starts from stopped.

Do not reload or rewrite `audio.src` when only the ambience volume changes. Volume changes during playback must update active audio elements in place, otherwise the sound can stop or restart.

For loops with an abrupt file boundary, use an overlap loop instead of relying only on native loop playback. `loopOverlapMs` starts a standby audio element before the active one ends, then alternates between them. Viking focus ambience uses a `1000` ms overlap so the next loop begins one second before the current loop finishes.

Do not wire empty placeholder audio files into a live skin. If files are not real yet, keep the corresponding audio field `null`.

## Cursor Rules

Only wire the four app-supported cursor roles:

- `cursorDefault`
- `cursorPointer`
- `cursorText`
- `cursorDisabled`

Extra cursor files can remain in the theme folder for later states, but do not expand the contract until the UI consumes them.

## Color Palette Workflow

Derive palette values from the theme background and then tune for readability.

For Viking, sampled anchors were:

```text
#201f21
#313134
#434449
#585c65
#6f7d8d
#8696a7
#a0aebe
#c9d0d8
```

Use these as:

- darkest tones for shell/surfaces
- mid blue-gray for borders, tracks, muted text
- pale frost colors for text, accents, glow
- subdued wood/brown only when button art needs contrast

For future themes, sample the background first, then choose:

- `dashboardBg`
- `surface`
- `surfaceRaised`
- `surfaceInset`
- `panel`
- `panelBorder`
- `panelInner`
- `text`
- `textDark`
- `textMuted`
- `accent`
- `track`
- `fill`
- modal and toolbar colors

## Testing Checklist

Update or add tests for:

- skin catalog includes the new id in `listSkins()`
- `isSkinId(newId)` returns true
- unknown skins still fall back to `DEFAULT_SKIN_ID`
- every skin exposes all image, cursor, audio, capability, typography, color, and layout fields
- CSS variable keys remain stable across all skins
- theme picker lists and persists the new theme
- default remains the product-approved default (`viking` at the time of this guide update)
- ambient rendering:
  - warm renders embers
  - theme with snow renders snow
  - theme with `ambient: null` renders no particles
- audio mapping:
  - warm/neumorphism behavior stays unchanged
  - new theme maps each audio role correctly
  - focus ambience passes the configured fade-in option
  - changing ambience volume while playing does not pause, reload, or restart the sound
  - overlap ambience starts the standby loop before the active loop ends when `loopOverlapMs` is configured
- heatmap maps include the new `SkinId`

Run:

```bash
npm run lint
npm test
npm run build
```

Then visually verify in the browser:

- theme picker selection
- auth/login modal and locked signed-out state
- settings modal
- theme picker modal
- history/infographics modal
- app loading state and lazy loading fallbacks
- toast popups
- desktop dashboard layout
- mobile/square timer panel behavior
- signed-out locked panels
- signed-in analytics/notes/dragon panels
- notepad/input font exceptions
- heatmap and stats text contrast
- image-backed buttons do not show rectangular/glass backgrounds behind the art
- console errors
- ambient particles render and do not occlude the UI
- timer/control text remains inside art assets

## Viking Session Handoff

Use this as compressed context for the current Viking styling pass:

- Scope is Viking only unless a task explicitly says cross-theme.
- Norse should appear everywhere visible except editable text areas and inputs.
- Palatino Linotype is non-italic, both as Norse fallback and as the font for notepad/input text.
- Modal visuals were accepted; the remaining modal/popup/loading work was typography, contrast, and consistency.
- Main-screen work should be text color/style/contrast only unless the user explicitly calls out a sizing issue.
- The notes notepad top/bottom expansion was explicitly requested and is the exception to the no-spacing rule.
- The stats and heatmap panels needed stronger pale text and shadows/strokes over textured stone.
- Timer art buttons should not show default semi-transparent rectangular backgrounds or box-shadows.
- Focus ambience volume changes must not stop playback.
- Viking focus ambience should use a short overlap loop; current target is `loopOverlapMs: 1000`.

## Implementation Order

Recommended order for future themes:

1. Add assets under `public/assets/{Theme Name}/`.
2. Extend `SkinId` and add a catalog profile.
3. Add CSS variables only if the existing contract cannot express the theme.
4. Add the scoped theme CSS shard.
5. Add heatmap color mapping if the theme introduces a new `SkinId`.
6. Update tests.
7. Run tests/build.
8. Verify visually in the browser.

## Non-Negotiables

- New themes are selectable only unless explicitly requested as default.
- Keep `DEFAULT_SKIN_ID = "viking"` unless explicitly changed.
- Preserve existing theme visuals and behavior.
- Do not reuse unrelated theme-specific assets such as lava embers or Diablo cursors in a new theme unless explicitly requested.
- Prefer separate role-specific asset slots over CSS `nth-child()` or variable hijacking.
- Do not use decorative fonts globally unless the theme requires it and readability is acceptable.
