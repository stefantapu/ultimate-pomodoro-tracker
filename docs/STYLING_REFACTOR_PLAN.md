# Styling/Theming Refactor: Final State Snapshot

This document reflects the current **as-built** styling/theming architecture after the completed safe incremental refactor scope.

## Completed Phases Summary

The following work is complete:

1. Monolithic `dashboard.css` split into ordered dashboard style shards with behavior-preserving import order.
2. Theme/skin contract hardening in `src/shared/skins`:
   - stronger typing for required vs optional fields
   - explicit capabilities
   - centralized fallback behavior
3. Live consumer cleanup for obvious runtime/UI theme bypasses.
4. Modal/overlay selector-group dedupe and safe consolidation (no JSX contract changes).
5. Conservative CSS Modules migration for low-risk primitives/components:
   - `PanelShell`
   - `ThemedButton` base
   - toolbar icon base primitives
   - `TopControls`
   - `ActionButtons`
   - `TimerCard`
   - `DashboardLayout` shell/layout-owned base selectors
6. Selective cleanup around migrated components (dead selectors and exact-safe duplicate pruning).
7. Final safe incremental reduction pass:
   - additional exact-safe theme-selector reductions
   - selective DashboardLayout legacy structural class reduction
   - root shell token ownership cleanup
   - final dead/duplicate cleanup in touched families

## Current Styling Architecture

- `src/widgets/dashboard.css` is the temporary import hub and source-of-truth order boundary:
  1. `00-foundation-layout.css`
  2. `10-theme-warm-main.css`
  3. `20-analytics-vendor-and-panels.css`
  4. `30-auth-settings-toast.css`
  5. `40-responsive-dashboard-auth-settings.css`
  6. `50-toolbar-cursors.css`
  7. `60-history-dashboard.css`
  8. `70-theme-soft-form-dashboard.css`
  9. `80-theme-picker-and-soft-form-overrides.css`

- Theme contract flow is now explicit and typed:
  - `src/shared/skins/types.ts`
  - `src/shared/skins/catalog.ts`
  - `src/shared/skins/cssVars.ts`
- Root shell token application remains runtime-driven through `DashboardLayout`:
  - `className="dashboard-shell dashboard-shell--${activeSkin.id}"`
  - `style={mapSkinToCssVariables(activeSkin)}`

- Ownership model:
  - CSS Modules own component base styling where safely migrated.
  - Global shard CSS intentionally retains theme/state/responsive/specificity-sensitive overlays.

## CSS Modules Ownership (Current)

Current module-owned base families:

1. `PanelShell`: base shell/title/body primitives.
2. `ThemedButton`: base button + base active state.
3. Toolbar icon primitives: base positioning/label/icon defaults.
4. `TopControls`: wrapper base layout.
5. `ActionButtons`: wrapper base + start/reset base sizing.
6. `TimerCard`: base card sizing, body stacking, time/digit/separator structure.
7. `DashboardLayout`: shell/layout-owned structural wrappers and paired responsive base rules.

Note: compatibility class emission remains selective and intentional; not all legacy classes were removed.

## What Intentionally Remains Global

The following stay global by design for stability/cascade safety:

1. Warm/soft-form theme deltas (`.dashboard-shell--warm`, `.dashboard-shell--soft-form`) and true art-direction differences.
2. Asset-coupled selectors (panel/background/icon imagery and related theme art blocks).
3. Stateful/interactive visual selectors (running/active/impact/hover/focus families where theme-specific).
4. Responsive clusters still coupled to global cascade/specificity.
5. Modal/overlay families and their cross-family/theme overrides.
6. Vendor overrides (`react-activity-calendar`, toast styling blocks).
7. Shell-level cursor suites and root token scope selectors.

## Remaining Legacy Class Contracts by Necessity

Legacy classes intentionally still rendered/depended on include:

1. Root shell/theme wrappers:
   - `dashboard-shell`
   - `dashboard-shell--warm`
   - `dashboard-shell--soft-form`
2. Shell anchors still used by global selectors:
   - `dashboard-toolbar`
   - `dashboard-bottom-row`
   - `dashboard-lock-wrap*`
3. Migrated component compatibility families still needed for global theme/responsive coupling:
   - `timer-card*` (`is-running`, panel art/image, time/digit/separator families)
   - `top-controls`
   - `action-buttons*`
   - `panel-shell*`
   - `themed-button` + `themed-button--*` + `is-active`
   - `toolbar-icon-button*`

Structural DashboardLayout compatibility classes were safely reduced where no global dependency remained (for example structural wrappers now owned by `DashboardLayout.module.css`).

## Safe Future Follow-Ups (Optional, Not Required)

Conservative follow-ups that are safe candidates when needed:

1. Continue family-by-family selector dependency retirement for remaining compatibility classes.
2. Move additional responsive rules into component modules only where ownership is singular and specificity risk is low.
3. Retire `dashboard.css` import-hub only after global shard dependencies are fully untangled and verified.
4. Keep warm/soft theme wrappers until token-only parity is proven for currently coupled art/state families.

### Intentionally Deferred

1. Broad theme-selector architecture rewrite.
2. Broad responsive architecture normalization.
3. Aggressive legacy class purge across heavily coupled selector families.
4. Visual redesign or runtime behavior changes.

## Final Verdict

The styling/theming refactor is **functionally complete for the safe incremental scope**.  
Architecture is now significantly cleaner and more explicit, while intentional global/theme coupling is retained where required for visual and runtime stability.
