---
name: themed-ui-layout-skill
description: Rules for working with image-based themed UI panels, layout stability, and responsive composition in the Pomodoro project
---
# Project Skills / Working Rules

## Project context

This project is a themed Pomodoro web app with a highly stylized fantasy UI.

Tech stack:
- React
- TypeScript
- Native CSS
- CSS Modules

This is not a standard dashboard or a generic app UI.
The interface uses decorative image-based panels (`webp` assets) as visual containers for real interactive HTML content.

Because of that, layout work must follow special rules.

---

## Core UI principle

The UI is built from two separate layers:

1. **Visual layer**
   - decorative background panels
   - themed frames
   - textured `webp` assets
   - atmospheric visual effects

2. **Functional layer**
   - real text
   - buttons
   - inputs
   - timers
   - stats
   - notes
   - dynamic data

These two layers must work together without breaking alignment.

The decorative panel should behave like a stable “frame”.
The content inside it must stay fixed relative to that frame.
The panel itself may scale as a whole, like image zoom, but internal content should not drift randomly.

---

## Critical rule: themed panels must feel solid

A block with a `webp` background must feel like a solid UI object.

That means:

- the background image is treated as a fixed visual frame
- inner content must be positioned consistently inside that frame
- content must not “float” unpredictably when screen size changes
- padding, alignment, and internal structure must remain stable relative to the panel
- the panel can scale proportionally, but its internal composition must still feel anchored

Think of each panel as a physical game UI plate:
it can become bigger or smaller, but the text and controls inside must still feel properly placed inside that same object.

### Do:
- preserve aspect ratio where appropriate
- use stable inner wrappers inside each panel
- define clear content areas within the panel
- scale the panel carefully
- keep content anchored using predictable layout rules

### Do not:
- place content with random nudges just to “make it look okay once”
- rely on fragile offsets that break at nearby widths
- let content drift relative to the decorative frame
- stretch panels independently in X/Y if it damages the illusion of a solid object
- treat these panels like generic flat cards

---

## Layout philosophy

### Inside a panel:
Use stable layout.

The contents inside each panel should usually be organized with:
- flex
- grid
- fixed internal padding
- predictable alignment rules

The goal inside a panel is not fluid randomness.
The goal is internal stability.

### Between panels:
Use dynamic page layout.

Panels themselves should be arranged responsively on the page using:
- CSS Grid
- Flexbox
- consistent gap system
- responsive wrappers
- breakpoints

So the rule is:

- **inside panels = stable**
- **between panels = dynamic**

This distinction is very important.

---

## Preferred layout approach

### 1. Treat each major panel as a component-level container
Each visual block should have:
- outer wrapper
- decorative background/frame layer
- inner content wrapper

Example mental model:
- `panelShell`
- `panelBackground`
- `panelContent`

Even if the actual class names differ, the structure should follow this idea.

### 2. Use inner content wrappers
Never place text/buttons directly against a decorative asset without a defined content wrapper.

Each panel should define:
- usable content area
- internal padding bounds
- alignment rules

### 3. Let the page layout solve panel placement
The page should organize panels dynamically.
If needed, panels may be arranged in a grid based on their natural dimensions and visual priority.

For example:
- main timer area gets dominant width
- right sidebar panels stack vertically
- bottom metrics panels align as a structured row
- smaller screens switch to stacked composition

### 4. Use dimensions intentionally
Panel dimensions should come from:
- asset proportions
- intended visual hierarchy
- layout role

Do not assign arbitrary widths just to patch local problems.

---

## Responsiveness rules

The app should remain visually coherent across sizes, but not every element must behave like a fully fluid modern SaaS UI.

This is a themed interface with composition constraints.

### Responsive goal:
- preserve the scene and visual hierarchy
- preserve panel integrity
- prevent misalignment and drifting
- allow structured reflow between panels

### On resize:
- panels may scale
- page layout may reflow
- columns may stack
- gaps and padding may adjust

### But:
- internal content inside a themed panel should remain stable
- decorative frames should not look broken
- the UI should not feel like text is swimming inside image boxes

---

## When using CSS Grid vs Flexbox

### Prefer Grid for:
- main page composition
- arranging multiple panels
- aligning dashboard sections
- creating responsive two-column or multi-row structures

### Prefer Flexbox for:
- button rows
- icon/text alignment
- internal panel alignment
- small horizontal or vertical groups

### If needed:
Use grid to determine where panels live on the page based on their size and role.

---

## Background image handling rules

When a panel uses a `webp` image:

- keep the image visually stable
- prefer predictable scaling behavior
- avoid background treatment that causes awkward cropping or drifting
- preserve the illusion that the frame and content belong together

The image should behave more like a UI object than a decorative wallpaper.

If necessary, design the wrapper so the panel scales like a single unit.

---

## Panel scaling rule

A themed panel may scale as a whole unit, similar to zooming an image.

However, the content inside that panel must remain visually locked to its intended content area.

Scaling the panel is acceptable.
Letting internal content reflow chaotically inside the frame is not.

---

## What the agent must NOT do

Unless explicitly asked, do not:

- redesign the app into a generic modern dashboard
- replace the fantasy theme with flat UI
- rewrite large sections of component structure
- refactor logic when the task is visual/layout only
- delete working code to rebuild from scratch
- mix layout fixes with state-management rewrites
- solve alignment problems by introducing brittle manual offsets everywhere

This project requires controlled, minimal, targeted changes.

---

## Expected working style for this project

When making changes:

1. First identify:
   - which part is page layout
   - which part is panel shell
   - which part is panel content
   - whether the problem is inside-panel stability or between-panel layout

2. Then choose the smallest safe fix:
   - internal wrapper adjustment
   - grid/flex correction
   - spacing normalization
   - panel scaling rule
   - breakpoint refinement

3. Avoid broad refactors unless explicitly requested.

---

## Decision rule

Before changing code, ask:

**Is this problem about internal panel stability, or about page-level panel arrangement?**

If it is about internal panel stability:
- preserve the panel
- fix the content anchoring inside it

If it is about page-level arrangement:
- keep panel internals intact
- fix the outer layout system

Do not mix both unless necessary.

---

## Summary

This project is a stylized image-based interface, not a plain card-based app.

The correct mental model is:

- themed image panels are solid UI objects
- their internal content must stay anchored and stable
- those objects may scale proportionally
- the page must arrange those objects dynamically and cleanly
- layout fixes must be precise, minimal, and respectful of the theme