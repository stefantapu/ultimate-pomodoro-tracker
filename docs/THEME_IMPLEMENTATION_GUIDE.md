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
- `viking`: selectable theme, warm-like layout proportions, Viking art, snow particles, custom cursors, distinct audio roles, Norse timer/control font, Palatino Linotype Italic for general UI.

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

## Typography Rules

Use decorative fonts narrowly.

For Viking, the Norse font is used only for:

- timer counter
- Focus/Break buttons
- Start/Pause button
- Reset button

Everything else uses Palatino Linotype Italic through the skin typography config.

For future themes, decide whether the decorative font is:

- display-only
- timer/control-only
- global

Prefer timer/control-only unless readability is proven.

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

Use `focusAmbienceFadeInMs` for loops that start abruptly. The fade applies only when playback starts from stopped; native loop playback should continue without a fade between loop iterations.

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
- default remains `warm`
- ambient rendering:
  - warm renders embers
  - theme with snow renders snow
  - theme with `ambient: null` renders no particles
- audio mapping:
  - warm/neumorphism behavior stays unchanged
  - new theme maps each audio role correctly
  - focus ambience passes the configured fade-in option
- heatmap maps include the new `SkinId`

Run:

```bash
npm test
npm run build
```

Then visually verify in the browser:

- theme picker selection
- desktop dashboard layout
- mobile/square timer panel behavior
- signed-out locked panels
- signed-in analytics/notes/dragon panels
- console errors
- ambient particles render and do not occlude the UI
- timer/control text remains inside art assets

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
- Keep `DEFAULT_SKIN_ID = "warm"` unless explicitly changed.
- Preserve existing theme visuals and behavior.
- Do not reuse unrelated theme-specific assets such as lava embers or Diablo cursors in a new theme unless explicitly requested.
- Prefer separate role-specific asset slots over CSS `nth-child()` or variable hijacking.
- Do not use decorative fonts globally unless the theme requires it and readability is acceptable.
