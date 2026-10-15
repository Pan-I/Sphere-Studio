# Sphere Studio

[![CI](https://github.com/Pan-I/Sphere-Studio/actions/workflows/ci.yaml/badge.svg)](https://github.com/Pan-I/Sphere-Studio/actions/workflows/ci.yaml)

Simple, browser-based drawing tools for art practice.

Sphere Studio is a small React + TypeScript site built with Vite. Each tool lives on its own page and is listed on the home page and in the site navigation. Everything runs in the browser: there is no backend, and nothing leaves the page except the links you choose to share.

## Contents

- [Tools](#tools)
  - [Sphere Randomizer](#sphere-randomizer)
  - [Circle Trio 1](#circle-trio-1)
  - [Circle Trio 2](#circle-trio-2)
  - [Box Randomizer](#box-randomizer)
  - [Cylinder Randomizer](#cylinder-randomizer)
  - [Cone Randomizer](#cone-randomizer)
  - [Lit Sphere](#lit-sphere)
  - [Value Study](#value-study)
  - [Perspective Grid](#perspective-grid)
  - [Form Combo](#form-combo)
  - [Practice sessions](#practice-sessions)
  - [Printable worksheets](#printable-worksheets)
  - [Keyboard shortcuts and full screen](#keyboard-shortcuts-and-full-screen)
  - [Adding a tool](#adding-a-tool)
- [How the Sphere Randomizer works](#how-the-sphere-randomizer-works)
  - [Random rotations with quaternions](#random-rotations-with-quaternions)
  - [The sphere and its eight sectors](#the-sphere-and-its-eight-sectors)
  - [Drawing](#drawing)
  - [Seeds and shareable poses](#seeds-and-shareable-poses)
- [How Circle Trio 1 and 2 work](#how-circle-trio-1-and-2-work)
- [How the Box Randomizer works](#how-the-box-randomizer-works)
- [How the Cylinder Randomizer works](#how-the-cylinder-randomizer-works)
- [How the Cone Randomizer works](#how-the-cone-randomizer-works)
- [How the Lit Sphere works](#how-the-lit-sphere-works)
- [How the Value Study works](#how-the-value-study-works)
- [How the Perspective Grid works](#how-the-perspective-grid-works)
- [How the Form Combo works](#how-the-form-combo-works)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Deployment](#deployment)
- [Continuous integration](#continuous-integration)

---

## Tools

| Tool | Route | What it's for |
| --- | --- | --- |
| [Sphere Randomizer](#sphere-randomizer) | `/sphere-randomizer` | Generate a sphere to practice drawing a random face. |
| [Circle Trio 1](#circle-trio-1) | `/circle-trio-1` | Generate two large circles and a small one to practice drawing a random face. |
| [Circle Trio 2](#circle-trio-2) | `/circle-trio-2` | Generate one large circle and two small ones on its edge to practice drawing a random face. |
| [Box Randomizer](#box-randomizer) | `/box-randomizer` | Generate a cube in a random orientation to practice drawing boxes. |
| [Cylinder Randomizer](#cylinder-randomizer) | `/cylinder-randomizer` | Generate a cylinder in a random orientation and proportion to practice ellipses and the minor axis. |
| [Cone Randomizer](#cone-randomizer) | `/cone-randomizer` | Generate a cone in a random orientation and proportion to practice the base ellipse and the side lines that meet it. |
| [Lit Sphere](#lit-sphere) | `/lit-sphere` | Generate a sphere lit from a random direction to practice light, shadow and values. |
| [Value Study](#value-study) | `/value-study` | Load a photo and see it in grayscale and grouped into 3, 5 or 7 values, to plan a drawing's big light and dark shapes. |
| [Perspective Grid](#perspective-grid) | `/perspective-grid` | Generate a 1, 2 or 3 point perspective grid with the horizon and vanishing points marked, to practice boxes in a scene. |
| [Form Combo](#form-combo) | `/form-combo` | Generate a sphere, box and cylinder pushed into each other, with the lines where they meet marked, to practice forms that intersect. |
<!-- Add one row per new tool. -->

[Practice sessions](#practice-sessions), at `/practice`, run several of these one after another on the timer.

---
### Sphere Randomizer

**Route:** `/sphere-randomizer` · **Source:** `src/tools/sphere-randomizer/`

A randomly rotated sphere split into eight sectors by three perpendicular great circles, with a timer and shareable poses, for form drawing practice.

**Features**

- **Randomize** shows a new, uniformly random orientation.
- **Timer**: set an interval (1 to 3600 seconds) and press Start; a new pose appears each time it runs out. Pause and Resume keep the remaining time, and any manual pose change restarts the countdown. A ring beside the time drains as it counts down, and a soft chime plays when the timer brings a new pose (see Timer ring and chime below).
- **Seeds**: every pose has a seed from 0 to 999,999. The current seed is shown on the page and kept in the address bar as `?seed=…`, so the URL is always a link to the exact pose. **Copy link** copies it, and **Load seed** jumps to a seed you type in.
- **Display options** (saved in your browser between visits; **Reset to defaults** puts them back):
  - Shading: color, grayscale, or none (lines only)
  - Line thickness: 1 to 8 px
  - Show far-side lines: draws the hidden half of each circle faintly
  - Show center marker: a dot on one of the points where two circles cross, on the side facing you

How it works is covered in detail [below](#how-the-sphere-randomizer-works).

---

### Circle Trio 1

**Route:** `/circle-trio-1` (the old `/circle-trio` address, seed included, redirects here) · **Source:** `src/tools/circle-trio/`

Two large translucent circles and a smaller one near the line between them, in a new arrangement each time, for practicing overlapping forms. The small circle can drift well off that line, or past either large circle's centre.

**Features**

- **Randomize**, the **timer**, and **seeds** work exactly as in the Sphere Randomizer, with their own `?seed=` links.
- **Display options** (saved in your browser between visits; **Reset to defaults** puts them back):
  - Fill: color, grayscale, or none (outlines only)
  - Opacity: 15% to 60%
  - Line thickness: 1 to 8 px
  - Show outlines (always on when there is no fill)
  - Show centers: a dot at the middle of each circle

How the arrangement is chosen is covered [below](#how-circle-trio-1-and-2-work).

---

### Circle Trio 2

**Route:** `/circle-trio-2` · **Source:** `src/tools/circle-trio-2/`

One large translucent circle, placed randomly, and two smaller ones of similar size close together on its edge. Each small circle can be fully inside, across the edge or fully outside, but never both outside.

**Features**

- Everything Circle Trio 1 has: Randomize, the timer, seeds and `?seed=` links, and the same **Display options**, saved separately from Circle Trio 1's.

How the arrangement is chosen is covered [below](#how-circle-trio-1-and-2-work).

---

### Box Randomizer

**Route:** `/box-randomizer` · **Source:** `src/tools/box-randomizer/`

A cube in a random orientation, the other core form in drawing practice, with the faces that point at you shaded and the edges behind shown faintly.

**Features**

- **Randomize**, the **timer**, and **seeds** work exactly as in the Sphere Randomizer. A seed gives the cube the same rotation it gives the sphere.
- **Display options** (saved in your browser between visits; **Reset to defaults** puts them back):
  - Shading: color, grayscale, or none (lines only). Each axis has its own shade, so the faces you see always differ.
  - Line thickness: 1 to 8 px
  - Perspective: near edges look bigger than far ones. Off gives a flat (orthographic) view where parallel edges stay parallel.
  - Show hidden edges: draws the edges behind the cube faintly
  - Show center lines: a cross on each face through its centre, joining the middles of opposite edges

How it works is covered [below](#how-the-box-randomizer-works).

---

### Cylinder Randomizer

**Route:** `/cylinder-randomizer` · **Source:** `src/tools/cylinder-randomizer/`

A cylinder in a random orientation, from squat to long, for practicing ellipses. The trick people find hardest is that each end's ellipse has its minor (short) axis lined up with the cylinder's axis, so the axis is drawn through it.

**Features**

- **Randomize**, the **timer**, and **seeds** work exactly as in the Sphere Randomizer. A seed gives the cylinder the same rotation it gives the sphere and the cube, and also picks its proportions: the length runs from half the diameter to three times it. With **Uniform size** on (the default) every cylinder is twice as long as it is wide instead.
- **Display options** (saved in your browser between visits; **Reset to defaults** puts them back):
  - Shading: color, grayscale, or none (lines only). The side and the end facing you get different shades.
  - Line thickness: 1 to 8 px
  - Perspective: near parts look bigger, so the near end is a little larger than the far one. Off gives a flat view where the two ends are identical ellipses.
  - Uniform size (height 2× diameter): on by default. Off uses the seed's random proportions.
  - Show hidden edges: draws the back half of the far end faintly, and the axes of an ellipse that faces away
  - Show axis: a dashed red line through the centres of both ends
  - Show ellipse axes: each ellipse's major axis in red and minor axis in dark blue, faint on an end that faces away
  - Show center lines: a cross on each end through its true centre, along the diameters that become the ellipse's axes

---

### Cone Randomizer

**Route:** `/cone-randomizer` · **Source:** `src/tools/cone-randomizer/`

A cone in a random orientation, from squat to tall, for practicing the base ellipse and the two straight side lines, which touch the ellipse rather than meeting it at the ends of its long axis.

**Features**

- **Randomize**, the **timer**, and **seeds** work exactly as in the Sphere Randomizer. A seed gives the cone the same rotation and proportions it gives the cylinder: the height runs from half the base's diameter to three times it. With **Uniform size** on (the default) every cone is twice as tall as its base is wide instead.
- **Display options** (saved in your browser between visits; **Reset to defaults** puts them back):
  - Shading: color, grayscale, or none (lines only). The side and the base get different shades.
  - Line thickness: 1 to 8 px
  - Perspective: near parts look bigger. Off gives a flat (orthographic) view.
  - Uniform size (height 2× diameter): on by default. Off uses the seed's random proportions.
  - Show hidden edges: draws the back of the base faintly when the base faces away, and its ellipse's axes
  - Show axis: a dashed red line through the apex and the centre of the base
  - Show ellipse axes: the base ellipse's major axis in red and minor axis in dark blue, faint when the base faces away
  - Show center lines: a cross on the base through its true centre, along the diameters that become the ellipse's axes

### Lit Sphere

**Route:** `/lit-sphere` · **Source:** `src/tools/lit-sphere/`

A sphere resting on a floor, lit from a random direction, for practicing light and shadow: the light side with its highlight and halftone, the core shadow just past the terminator, the reflected light in the shadow, and the cast shadow on the floor, darkest where the sphere touches it.

**Features**

- **Randomize**, the **timer**, and **seeds** work exactly as in the Sphere Randomizer. Here a seed picks the light: from the left or the right, anywhere from beside you round to behind the sphere (never straight from behind you or straight behind the sphere), and from 30° to 65° above the floor.
- **Display options** (saved in your browser between visits; **Reset to defaults** puts them back):
  - Shading: grayscale (the default, a plain value study), color (warm light and cool shadow), or none (lines only: the outline, the terminator, the shadow's edge and a ring at the highlight)
  - Line thickness: 1 to 8 px
  - Flat value zones: each zone gets one flat value, like a value-grouping sketch, instead of smooth shading
  - Show terminator and shadow edge: the line where light turns to shadow, faint where it runs round the back, and the outline of the cast shadow. Always on in lines only.
  - Show light direction: a small sun with an arrow toward the sphere, faint when the light is behind the sphere
  - Label the zones: names each zone with a callout (highlight, halftone, core shadow, reflected light, cast shadow, occlusion)

How the light is chosen and the shading worked out is covered [below](#how-the-lit-sphere-works).

### Value Study

**Route:** `/value-study` · **Source:** `src/tools/value-study/`

Load a photo and see it in grayscale and grouped into 3, 5 or 7 flat values, to plan the big light and dark shapes before you draw or paint. It's the first tool that takes your own picture, and the picture never leaves your browser: it's decoded and processed on a canvas in the page, never uploaded, and gone when you close or reload the tab.

**Features**

- **Open a photo** (or press <kbd>O</kbd>), drag one onto the tool, or paste one (Ctrl+V / Cmd+V). JPEG, PNG, WebP and anything else your browser can show work. **Back to samples** puts the sample back.
- Before you open a photo, it shows a **sample**: the Lit Sphere's sphere for the seed, smoothly shaded. **Randomize**, the **timer** and **seeds** work as on the other tools and pick a new sample. They're hidden while you study a photo.
- **The value scale** under the picture shows each value as a swatch, with how much of the picture it covers.
- **Display options** (saved in your browser between visits; **Reset to defaults** puts them back):
  - Show: **Values** (grouped into flat values, the default), **Grayscale** (smooth), or the **Original** photo
  - Number of values: 3, 5 (the default) or 7, from black to white in even steps
  - Simplify (squint): 0 to 10 px of blur before grouping, so small details merge into the big shapes, like squinting. Default 2 px.
  - Stretch to full range (on): spreads a flat or hazy photo's values over black to white first, so it still uses every value. Turn it off to see the photo's own range.
  - Outline the value shapes (off): cyan lines where one value meets the next, on any view. On the original photo, they show where its value shapes are.
  - Show value scale (on)
- **Extra keys**: <kbd>O</kbd> opens a photo, <kbd>V</kbd> switches between values, grayscale and original, and <kbd>3</kbd>, <kbd>5</kbd> and <kbd>7</kbd> set the number of values.

How the values are measured and grouped is covered [below](#how-the-value-study-works).

### Perspective Grid

**Route:** `/perspective-grid` · **Source:** `src/tools/perspective-grid/`

A random 1, 2 or 3 point perspective grid with the horizon line and vanishing points marked, for practicing boxes in a scene. Draw boxes, rooms or buildings along the guide lines, or try placing your own vanishing points and check them against the grid.

**Features**

- **Guide lines** fan out from each vanishing point across the canvas, in its own color: VP 1 (left, on the horizon) blue, VP 2 (right, on the horizon) orange, and VP 3 (where verticals meet, in 3 point) green.
- **Points off the canvas** are shown by an arrow at the edge, pointing the way to them, with "(off canvas)" in the label. The lines still run toward them exactly. At least one point is always on the canvas, and so is the horizon.
- **Randomize**, the **timer** and **seeds** work as on the other tools. The number of points comes from the seed, so a shared link shows the same grid to everyone, whatever they picked.
- **Display options** (saved in your browser between visits; **Reset to defaults** puts them back):
  - Vanishing points: **Any (1, 2 or 3)** (the default), or only 1, 2 or 3 point grids. Picking one switches to a nearby grid that has that many, and Randomize and the timer keep to it.
  - Grid colors: one per point (the default), or grayscale
  - Line thickness: the horizon and the sample box; the guide lines are half as thick
  - Grid lines per point: 0 to 24, default 10. At 0 only the horizon and the points are left.
  - Show horizon line (on)
  - Label the points (on)
  - Show a sample box (off): a box standing square to the grid, with each edge in the color of the point it runs toward, its hidden edges faint. Draw your own first, then turn this on to compare.
- **Extra keys**: <kbd>1</kbd>, <kbd>2</kbd> and <kbd>3</kbd> keep to 1, 2 or 3 point grids, <kbd>0</kbd> goes back to any, and <kbd>B</kbd> shows or hides the sample box.

How the grid is chosen and drawn is covered [below](#how-the-perspective-grid-works).

### Form Combo

**Route:** `/form-combo` · **Source:** `src/tools/form-combo/`

A sphere, a box and a cylinder in random orientations and sizes, pushed partway into each other, for practicing forms that intersect. The hard part of drawing them is the line where one form goes into another, so that line is drawn in its own color. Try drawing the forms first, then work out where they meet, and check against the picture.

**Features**

- **Where forms meet** is drawn in purple: the curve where the cylinder's side goes into the sphere, the box's corner pokes out of the cylinder, and so on. Every form runs into at least one other, none is mostly inside another, and each one shows well enough not to hide behind the rest.
- **Hidden lines** are drawn faintly, whether a form hides them, another form does, or they are inside another form, so you can see each form whole.
- The forms are the same ones the other randomizers draw: the sphere with its three sector lines, the box with its faces shaded by direction, and the cylinder and cone with their rims and side lines.
- **Randomize**, the **timer** and **seeds** work as on the other tools.
- **Display options** (saved in your browser between visits; **Reset to defaults** puts them back):
  - Forms: **Sphere, box and cylinder** (the default), two of them (the seed picks which), or all three and a cone
  - Shading: color (the default, one color per form, with the box's faces in three shades), grayscale, or none (lines only)
  - Line thickness
  - Perspective (on)
  - Uniform cylinders and cones (off): every cylinder and cone twice as long as it is wide, like "Uniform size" on the Cylinder and Cone Randomizers. Off, the seed picks each one's proportions.
  - Highlight where forms meet (on). Off, those lines are drawn in black like the rest.
  - Show hidden edges (on)
  - Show the sphere's sector lines (on)
  - Show cylinder and cone axes (off): dashed, as on the Cylinder and Cone Randomizers
  - Show ellipse axes (off): the major (red) and minor (blue) axes of each cylinder cap's and cone base's ellipse, as on the Cylinder and Cone Randomizers. An end you can see gets them at full strength; one facing away, or behind or inside another form, gets them faintly with the hidden edges.
- **Extra keys**: <kbd>2</kbd>, <kbd>3</kbd> and <kbd>4</kbd> pick two forms, the sphere, box and cylinder, or all four. <kbd>M</kbd> turns the highlight on or off, and <kbd>H</kbd> the hidden edges.

The forms you get depend on the Forms option as well as the seed, so a shared link shows the same picture to someone with the same choice. How the forms are placed and drawn is covered [below](#how-the-form-combo-works).

<!--
### Tool name

**Route:** `/tool-slug` · **Source:** `src/tools/tool-slug/`

One or two sentences on what the tool is for.

**Features**

- …

If the tool has non-obvious internals, add a "How <Tool name> works" section
further down and link to it from here.
-->

---

### Practice sessions

**Route:** `/practice` · **Source:** `src/practice/`

A playlist across tools, like "5 spheres at 60s, then 5 trios at 90s", so the site works as a practice routine rather than a set of separate tools. **Practice** is the first link in the header, and the home page links to it too.

- **Putting one together**: each step is a tool, a number of poses (1 to 50) and the seconds for each pose (1 to 3600), up to 12 steps. Change the order with ↑ and ↓, remove a step with ×, or add one with **+ Add a step**. **Start from** loads a ready-made session: **Warm-up** (the example above), **Quick sketches** (10 spheres and 10 boxes at 30s) or **Forms** (boxes, cylinders and cones at 90s, then two Form Combos at 3 minutes). The total poses and time show beside **Start session**. Value Study isn't offered, since it works on your own photo. The list is saved in your browser under `sphere-studio:practice`, half-typed numbers and all.
- **Running it**: **Start session** opens the first step's tool with its timer already running at that step's interval. A bar above the drawing says which step and pose you're on and what comes next, with a thin line along its bottom for the whole session. When a pose's time runs out you get a new one, with the chime if it's on; after the step's last pose the next tool takes over on its own, in full screen too. Everything on the tool page works as usual: Pause (or <kbd>P</kbd>) holds the session, Randomize (or <kbd>Space</kbd>) skips a pose you don't like without counting it, and you can star poses, download them, and change the Display options. Only the interval is locked, since the session sets it. **Next step** (or <kbd>N</kbd>) moves on early, and **End session** stops.
- **At the end**: every pose whose time ran out, step by step, as small drawings with their seeds. Click one to open that pose on its tool's page, to look at it again or star it. **Go again** runs the same session, and **Change the session** goes back to the list.
- **The address bar** stays on `/practice` during a session, since the poses come one after another. **Copy link** still links to the pose on its tool's own page.

How it works: `PracticePage` switches between the list (`PracticeSetup`), the running session (`PracticeRunner`) and the summary (`PracticeSummary`), and `playlist.ts` has the steps, presets and saving. `PracticeRunner` shows the step's tool on an ordinary tool page (`ToolPage`, with the bar passed in as its `banner`), inside a `PracticeContext` (`src/tools/shared/practice.ts`). `useSeedSession` reads that context: it starts the timer by itself at the step's interval, ends the run on the step's last pose (the `last` flag on the timer's tick), and reports each pose whose time ran out back to the runner, which moves to the next step. The runner keeps one tool page for the whole session and only swaps the tool inside it, which is why full screen carries on from step to step.

---

### Printable worksheets

**Route:** `/worksheet` · **Source:** `src/worksheet/`

A page of 6 or 12 poses from one tool, from consecutive seeds, to print and draw from on paper. **Worksheet** is next to Practice in the header, and the home page links to it too.

- **Choosing**: the tool (any tool a practice session can use, so not Value Study), 6 or 12 poses, and **Room to draw beside each pose**, which frames each pose in a box with space to its right for your drawing. Without it the poses are as big as the page allows. Your choices are saved in your browser under `sphere-studio:worksheet`.
- **Seeds**: each sheet starts at a random seed and counts up, e.g. 48213 to 48218, and each pose is labelled with its seed so you can open it on its tool's page later. **New sheet** (or <kbd>Space</kbd>) picks a new first seed, and **First seed** loads one you type.
- **The address bar** holds the whole sheet, e.g. `/worksheet?tool=box-randomizer&seed=48213&poses=6&room=1`, so a link or a reload brings back the same sheet.
- **Printing**: **Print** (or your browser's <kbd>Ctrl</kbd>+<kbd>P</kbd>) prints only the sheet, on one page of A4 or US Letter, on white paper even in dark mode. The poses use each tool's default Display options.

How it works: the sheet is laid out in millimetres (186 × 250 mm, which fits inside A4 and Letter with 12 mm margins). `worksheet.ts` works out the grid and the size of each pose, and on screen `worksheet.css` scales the same layout to a preview, using a container query unit as its millimetre. Each pose is drawn with its tool's `drawExample`, the same function as the home-page cards, on a canvas sized for 300 dpi on paper. The sheet sets `--paper` and `--ink` to white and pencil for everything inside it, so the drawings (which read those, see `paper.ts`) come out as on white paper whatever the theme. A print style sheet hides everything else.

---

### Keyboard shortcuts and full screen

Every tool page has these, so your hand can stay on the pencil:

| Key | What it does |
| --- | --- |
| <kbd>Space</kbd> | New pose (a new sheet on the [worksheet](#printable-worksheets) page) |
| <kbd>P</kbd> | Start or pause the timer |
| <kbd>←</kbd> / <kbd>→</kbd> | Back and forward through this session's poses |
| <kbd>S</kbd> | Star or unstar this pose (see Favorites below) |
| <kbd>C</kbd> | Chime on or off (see Timer ring and chime below) |
| <kbd>D</kbd> | Download the drawing as a PNG (see below) |
| <kbd>F</kbd> | Full screen on or off (<kbd>Esc</kbd> also leaves) |
| <kbd>T</kbd> | Theme: Auto, Light or Dark (see Dark mode below; works on the home page too) |
| <kbd>N</kbd> | Next step, during a [practice session](#practice-sessions) |
| <kbd>?</kbd> | Show the list of shortcuts |

Shortcuts are ignored while you're typing in a field, and when Ctrl, Cmd or Alt is held, so browser shortcuts like Ctrl+P still work.

**Pose history**: **← Back** and **Forward →** under Randomize step through the last 20 poses you've seen on that page, so a pose you skipped past (or the timer replaced) isn't lost. "Pose 3 of 7" shows where you are. Every new pose (Randomize, the timer, a loaded seed, an option that picks a new pose) goes on the end; if you'd gone back, the poses ahead of you are dropped, as in a browser. Going back or forward restarts a running timer's countdown, like Randomize does. The history is for this visit only: it starts again when you reload or open another tool, and the address bar always holds the pose on screen, so Copy link still shares it.

**Favorites**: **☆ Favorite** beside the seed (or <kbd>S</kbd>) stars the pose on screen, and the **Favorites** box under the session controls lists every pose you've starred on that tool, newest first. Click one to show it again (it goes on the end of the pose history, like a loaded seed), or **×** to remove it. Favorites are saved in your browser per tool, under `sphere-studio:<tool slug>:favorites` in `localStorage`, so they're still there next visit; each tool keeps up to 50, and starring one more drops the oldest. **Reset to defaults** only resets the Display options, never favorites. In full screen the box is hidden, but <kbd>S</kbd> still works and a ★ next to the timer shows the pose is starred.

**Timer ring and chime**: so you can keep your eyes on your paper, a ring beside the timer drains as the countdown runs, and a soft bell chimes when the timer runs out and brings a new pose. Poses you pick yourself (Randomize, Back, a seed, a favorite) don't chime. Untick **Chime on new pose** under the interval (or press <kbd>C</kbd>) to turn it off; ticking it again plays the chime once so you can check your volume. The setting is one for the whole site, saved in your browser under `sphere-studio:chime`, and **Reset to defaults** doesn't touch it. In full screen the ring stays beside the timer, a little bigger, and <kbd>C</kbd> still works. The chime is made in the browser with the Web Audio API (`src/tools/shared/chime.ts`), so there's no sound file; browsers only allow sound after a click or key press, which is why it's switched on when you press Start or <kbd>P</kbd>.

**Screen stays on**: while the timer is running, the page asks the browser to keep the screen from dimming and locking (the Screen Wake Lock API, `src/tools/shared/useWakeLock.ts`), so a phone or tablet propped beside your paper doesn't lock partway through a long interval. Pausing lets the screen sleep again. Browsers without it, or that refuse (some do on low battery), just behave as before.

**Download PNG**: the **Download PNG** button under the tool's name (or <kbd>D</kbd>) saves the drawing on screen as a PNG, for reference or printing. It's redrawn at 1600 × 1600 pixels whatever the size on screen (about 13.5 cm or 5.3 in at 300 dpi), with your Display options and the paper colour, so it looks like the screen, in light or dark mode (switch to Light first for a print on white). The file is named after the tool and seed, like `box-randomizer-48213.png`, so you can find the pose again later; in Value Study with your own photo open, it's named after the photo instead. <kbd>D</kbd> works in full screen too, and the button stays on phones and tablets.

**Dark mode**: the button at the end of the header (or <kbd>T</kbd>) steps through **Auto**, **Light** and **Dark**. Auto, the default, follows your device's setting and changes with it; Light and Dark stick to that choice on this site whatever the device says. The choice is saved in your browser under `sphere-studio:theme`.

- **The page**: a near-black background with light text, and the accent colour lightened where it's text (links, stars) so it stays readable.
- **The drawing**: dark paper, slightly lighter than the page so you can see where it ends, and light pencil lines. Fills and shading are dimmed toward the paper, like turning down the lights: every value keeps its place and its spacing (a light face stays lighter than a dark one, a lit side lighter than its shadow), over a narrower, darker range. The Lit Sphere and Value Study keep their full range instead, since their lights matter as much as their darks: black becomes the paper and white the pencil colour, so highlights stay bright. Coloured construction lines (axes, vanishing points, where forms meet) are lifted toward the pencil colour so they show on dark paper. The thumbnails on the home page follow along.
- **No flash**: a few lines in `index.html` apply a saved Light or Dark before the page draws, so a dark page never flashes white while it loads.

How it's built, as a CSS variables exercise:

- `src/index.css` defines every colour once as a variable on `:root` (`--bg`, `--text`, `--surface`, `--accent`, `--accent-text`, `--line`, `--paper`, `--ink`), with the light values first. A dark block replaces them, inside `@media (prefers-color-scheme: dark)` for Auto (skipped when `data-theme="light"` is set) and again for `[data-theme='dark']`. It also sets `color-scheme`, so the browser's own form controls and scrollbars match.
- `src/site/theme.ts` keeps the choice: it saves it, sets or removes `data-theme` on `<html>`, and offers `useThemeChoice` (for the button) and `useTheme` (light or dark as shown, following the device on Auto). `src/site/ThemeToggle.tsx` is the button and the <kbd>T</kbd> shortcut.
- Canvases can't use CSS colours directly, so `src/tools/shared/paper.ts` reads `--paper` and `--ink` from the canvas's style and gives each drawing a `Paper`: `paper.paper` and `paper.ink` for the background and lines, `paper.fill(color)` (or `fillRGB` for pixel shading) to dim a fill, `paper.valueRGB` to spread values from paper to ink for the value tools, and `paper.line(color)` to lift a coloured line. On white paper all three return the colour unchanged. In tests, where there's no stylesheet, it's always white paper. `useSquareCanvas` redraws when the theme changes.

**Full screen** shows only the drawing and the timer, for a second screen beside your paper. It uses the browser's Fullscreen API. Where that isn't available (iPhone Safari), the tool fills the browser window instead.

On phones and tablets (touch only, no mouse or trackpad), the **Full screen** and **Shortcuts** buttons are hidden (**Download PNG** stays) and <kbd>F</kbd> and <kbd>?</kbd> do nothing. `useTouchOnly` (in `src/site/`) decides this with the `(hover: none) and (pointer: coarse)` media query, so a tablet with a trackpad attached gets them back.

**Phones and tablets**: every page is laid out for the screen it's on, upright or on its side.

- **Tool links**: on phones and tablets, and on any screen too short for a tall header, the tool links sit in one row you swipe sideways, instead of wrapping into a block that pushes the drawing down. The row's edges fade to show there's more, and the tool you're on is scrolled into the middle. On touch screens the links are 44 pixels tall, like the buttons, so they're easy to hit.
- **Upright** (phones, and tablets held upright): one column, drawing first. On a tablet the drawing grows to fill the width, up to 40rem, while leaving Randomize and the timer in view under it.
- **On its side** (any screen wider than it is tall and at least 40rem wide, so laptops and desktops too): the drawing on the left, as big as the window's height allows, and the controls in a column beside it. The drawing stays put while the controls scroll. On a small phone the drawing shrinks a little so the controls keep enough room.
- **Home page**: on phones each card puts its thumbnail beside the text, so the list is half as long, and the whole card opens the tool (the thumbnail still opens it on the pose it shows).
- On touch screens, the Favorites box says to tap ☆ Favorite instead of naming the <kbd>S</kbd> key.
- **Touch gestures on the drawing**, the touch screen's version of the keyboard shortcuts: **swipe left** for the next pose (forward through your history, or a new pose when you're on the newest one, like <kbd>→</kbd> and <kbd>Space</kbd>), **swipe right** for the last one (like <kbd>←</kbd>), and **double-tap** to star or unstar the pose (like <kbd>S</kbd>), with a ★ or ☆ that pops up where you tapped. A line under Back and Forward says so on touch screens. They work in full screen too. Swipes have to be mostly sideways, so scrolling the page with a finger on the drawing still scrolls, and a mouse is left alone. The timer and chime stay as buttons, so a stray tap on the drawing can't pause your timer. The gestures are in `src/tools/shared/canvasGestures.ts`, used by `SessionControls`, so every seeded tool has them.

**For new tools and features:**

- **Adding a shortcut**: call `useShortcuts` from any component. The shortcut works while that component is on screen, is removed when it goes away, and appears in the <kbd>?</kbd> list automatically. If two components use the same key, the one that appeared most recently wins.

  ```tsx
  useShortcuts([{ key: 'd', description: 'Download PNG', run: downloadPng }])
  ```

- **Layout**: a tool returns `<div className="tool-layout">` holding its canvas (`className="tool-canvas"`) and then one `<div className="tool-controls">` with everything else, as every tool does. That shape is what lets the canvas sit beside the controls on a screen held sideways (`tool.css`); `src/site/mobileLayout.test.tsx` checks every tool has it.
- **Colours**: start a draw function with `const paper = paperFor(ctx)` and draw with `paper.paper`, `paper.ink`, `paper.fill(...)` and `paper.line(...)` instead of fixed colours, so it works in dark mode. With white paper they give back exactly the colours you wrote.
- **Full screen**: wrapping is done by the tool page, so a new tool gets it for free. In full screen, only the canvas and the parts of `tool-controls` marked `data-focus="show"` stay visible, and anything inside them marked `data-focus="hide"` is dropped. Mark your canvas with `data-focus="show"`. `SessionControls` already keeps the timer and its ring.
- **A sharp canvas at any size**: draw with `useSquareCanvas(SIZE, draw)` (in `src/tools/shared/`). It sizes the drawing buffer to the canvas's real size on screen, so it stays crisp in full screen, while `draw` keeps working in the same 0 to `SIZE` units. It also gives Download PNG your `draw` function, through `CanvasExportContext` from the tool page, so a new tool gets downloads for free: `canvasExport.ts` calls `draw` again on a 1600-pixel canvas placed hidden beside yours (so the paper and ink colours it reads from CSS come out the same) and fills the paper colour in behind it. Pass a third argument to name the file after something other than the seed, as Value Study does with your photo's name.

---

### Adding a tool

Tools are driven by one registry, `src/tools/registry.ts`. Adding an entry there gives the tool its route, nav link, and home-page card automatically.

1. Create a folder `src/tools/<slug>/` with a component that takes no props, for example `MyTool.tsx`. Keep tool-specific logic and styles in that folder; put reusable math in `src/math/`. Give its canvas `data-focus="show"` so it stays visible in [full screen](#keyboard-shortcuts-and-full-screen).
2. Register it in `src/tools/registry.ts`:

   ```ts
   {
       slug: 'my-tool',          // served at /my-tool; lowercase words joined by hyphens
       name: 'My Tool',
       description: 'One sentence for the home-page card.',
       component: MyTool,
       drawExample: drawMyToolExample, // the home-page thumbnail, see below
   },
   ```

   `drawExample(ctx, size, seed)` draws the picture for a seed on a square canvas `size` units wide, using the tool's default options. The home page calls it for a small live example on the tool's card, and clicking that example opens the tool on the same seed. It gets nothing from the tool's page, which makes it a quick check that the drawing code stands on its own. Put it in `src/tools/<slug>/example.ts`; the Sphere Randomizer's is only a few lines.

   To rename a tool's address later, keep the old one in `formerSlugs: ['old-slug']`. It then redirects to the new address, keeping `?seed=`, so shared links still open.

   A seeded tool that uses `useSeedSession` and `SessionControls` can be a step in a [practice session](#practice-sessions) with nothing more to do. Add `practice: false` to leave it out, as Value Study does.

3. Describe its display options in `src/tools/<slug>/displayOptions.ts` and the tool gets the **Display** panel, its defaults, and saving between visits for free. List one field per option with `defineOptions`; the panel shows them in that order. The shared presets keep common options identical across tools: `colorModeField` (color, grayscale or none), `lineWidthField` (1 to 8 px) and `toggleField` (a checkbox). A one-off option is a plain object, like Circle Trio 1's opacity:

   ```ts
   export const MY_OPTIONS = defineOptions<MyOptions>('sphere-studio:my-tool:display', {
       shading: colorModeField('Shading', 'None (lines only)'),
       lineWidth: lineWidthField(),
       showGuides: toggleField('Show guides', true),
   })
   export const DEFAULT_OPTIONS = MY_OPTIONS.defaults // for drawExample
   ```

   Then, in the component:

   ```tsx
   const [options, setOptions] = useStoredOptions(MY_OPTIONS)
   // ...
   <OptionsPanel fields={MY_OPTIONS.fields} options={options} onChange={setOptions} />
   ```

   TypeScript checks the fields against the options type: every option needs a field, and a boolean must be a toggle, a number a range, and a string a choice. A field can grey itself out with `disabledWhen(options)`, as Circle Trio 1's opacity does when there is no fill. Stored values are checked field by field when they are loaded, so a missing, renamed or out-of-range value falls back to its default instead of breaking the tool.

4. Add unit tests next to the code (`*.test.ts`). `src/tools/registry.test.ts` already checks that slugs are unique and URL-safe and that every tool has a name and description, and `src/tools/examples.test.ts` checks that every tool's example draws, and draws the same picture for the same seed.
5. Document it in this README: add a row to the [Tools](#tools) table and copy the commented-out template under the Sphere Randomizer section.

The page heading and browser tab title (`<Tool name> · Sphere Studio`) come from the registry entry, so the component only renders the tool itself.

---

## How the Sphere Randomizer works

### Random rotations with quaternions

The sphere's orientation is stored as a **unit quaternion** `q = (x, y, z, w)`, where `(x, y, z)` is the vector part and `w` the scalar part (`src/math/quat.ts`). Quaternions represent any 3D rotation without gimbal lock and are cheap to apply.

**Generating a uniform random rotation (Shoemake's method).** Picking three random Euler angles would favor some orientations over others. Instead, `randomQuat` uses Ken Shoemake's method, which samples a point uniformly on the unit 4-sphere and therefore gives every orientation equal probability. From three uniform numbers `u1, u2, u3` in [0, 1):

```
a  = √(1 − u1)        b  = √u1
θ2 = 2π · u2          θ3 = 2π · u3

q  = ( a·sin θ2,  a·cos θ2,  b·sin θ3,  b·cos θ3 )    // (x, y, z, w)
```

Because `a² + b² = 1`, the result is always a unit quaternion.

**Rotating a vector.** `rotate(q, v)` applies the rotation using the expanded form of `q v q*`, which needs only two cross products:

```
t  = 2 (q_v × v)
v' = v + w·t + q_v × t
```

**Undoing a rotation.** For a unit quaternion the inverse is its conjugate, `(−x, −y, −z, w)` (`conjugate`). The shading step uses it to map screen points back onto the unrotated sphere.

The tests in `src/math/quat.test.ts` check the identity rotation, a known 90° rotation about Z, that random quaternions have unit length and preserve vector lengths, and that results are deterministic for a given RNG seed.

### The sphere and its eight sectors

The model is a unit sphere with three mutually perpendicular **great circles** on the XY, YZ and XZ planes (`GREAT_CIRCLES` in `src/math/sphere.ts`). Each circle is defined by two orthonormal vectors spanning its plane, and its plane normal is their cross product. Together the three circles cut the sphere into **eight sectors** (octants).

A point's sector is a 3-bit number: bit *i* is set when the point is on the positive side of plane *i* (`dot(nᵢ, p) ≥ 0`), giving indices 0 to 7 (`sectorOf`). Two sectors that meet across a line differ in exactly one bit, so their bit parity alternates. The palettes in `palettes.ts` use that: even-parity sectors (0, 3, 5, 6) get light shades and odd-parity sectors (1, 2, 4, 7) get stronger ones, so neighbouring sectors always contrast.

The normals and the six circle crossing points (`INTERSECTIONS`, the `±(nᵢ × nⱼ)` for each pair of normals) are derived from `GREAT_CIRCLES` rather than written out separately, so the shading, lines and marker can't drift out of sync.

### Drawing

Drawing happens on a `<canvas>` with an **orthographic** view looking down the −Z axis, so a rotated point `(x, y, z)` lands on screen at `(x, y)` and `z > 0` means it faces the viewer (`drawSphere.ts`).

1. **Shading** works backwards, per pixel. Each pixel inside the disc becomes a normalized screen point `(nx, ny)`, which is lifted onto the front of the sphere as `(nx, ny, √(1 − nx² − ny²))` and rotated by the conjugate of `q` back to the unrotated sphere (`unprojectOrthographic`). Its sector there decides the pixel's color. This gives exact sector boundaries with no polygon tessellation.
2. **Lines.** Each great circle is sampled at 128 segments, rotated by `q`, and split into front and back runs by the average `z` of each segment (`splitByVisibility`). Front runs are drawn solid; back runs are drawn at 20% opacity, or skipped when far-side lines are off. Each run is stroked as one path so translucent lines don't show dots at the joints. The outline of the disc is drawn on top.
3. **Marker.** The six intersection points are rotated by `q`, and only those facing the viewer with `z > 0.2` are kept (`frontIntersections`), which keeps the dot from hanging off the rim. One of them is chosen using the pose's marker pick (see below).

The canvas buffer matches the screen's pixel ratio, capped at 2× (`canvasScale.ts`): shading is per pixel, and 3× would cost 2.25 times as many pixels for little visible gain.

### Seeds and shareable poses

Every pose comes from a single integer **seed** from 0 to 999,999 (`pose.ts`), short enough to type or read aloud. The seed is the single source of truth for what's on screen.

```
seed ──► mulberry32(seed) ──► draws 1–3 ──► randomQuat ──► orientation q
                          └─► draw 4    ──► markerPick ──► which front-facing crossing gets the dot
```

- **PRNG.** `mulberry32` (`src/math/random.ts`) is a small, fast 32-bit generator. The same seed always produces the same stream of numbers in [0, 1), on any browser.
- **Orientation** uses the first three draws, fed to Shoemake's method above.
- **Marker pick** is the fourth draw. It selects among the front-facing intersections as `floor(pick × count)`. Because the marker draw comes *after* the orientation draws, adding it didn't change the orientation of any existing seed, so old links still show the same pose. A test pins the quaternion for seed 48213 to guard this.
- **Picking a new seed.** Randomize and the timer choose a seed with `Math.random()`; the seed then deterministically produces the pose.
- **History.** The seeds shown so far live next to the timer in `timerState.ts`, using the small helpers in `poseHistory.ts` (add a pose, step back or forward, keep the last 20). The seed on screen is always the history's current entry, so Back, Forward, the timer and Randomize can't disagree.
- **Favorites.** A favorite is just a seed, so it shows exactly the same pose later, like a link does. The list lives in `favorites.ts` (reading stored data safely, starring and unstarring) and `useFavorites.ts`. The tool page tells the shared controls which tool they're on through `ToolSlugContext`, so each tool saves its own list.
- **Links.** The current seed is written to `?seed=…` with `history.replaceState`, keeping other URL parameters and the hash. On load, a valid `?seed=` takes priority over a random one. Invalid seeds (not a whole number, or out of range) are ignored.
- **What a seed doesn't include.** Display options (shading, line thickness, far-side lines, marker visibility) are personal preferences stored in `localStorage`, not part of the link, so a shared pose opens in each viewer's own style.

Tests in `pose.test.ts` check parsing, determinism, unit length, that consecutive seeds spread evenly across all eight sectors and marker picks spread evenly, and that share URLs round-trip.

## How Circle Trio 1 and 2 work

The canvas spans −1 to 1 on both axes, with y pointing up. Each tool's `layoutFromSeed` draws numbers from `mulberry32(seed)` in a fixed order.

### Circle Trio 1

`src/tools/circle-trio/layout.ts`:

1. **Sizes.** Large circle A has a radius from 0.38 to 0.48 and B from 0.28 to 0.38, so they are rarely the same size. The small circle is 35% to 55% of their average.
2. **Direction.** A random angle sets the line from A to B.
3. **Gap.** The centres are 0.55× to 1.10× the sum of the radii apart. Below 1× they overlap, which happens about 82% of the time.
4. **Small circle.** Its centre starts anywhere from 25% of the gap before A's centre to 25% past B's (−25% to 125% of the way from A to B), then moves sideways off that line. In 65% of layouts it moves up to 1.8× its radius; in the other 35% it drifts 1.8× to 4.2×, to a random side. At the far end it floats clear of both large circles, about 16% of the time.
5. **Placement.** `placeInFrame` centres the group, shrinks it if it's wider or taller than the 0.9 frame allows, then shifts it randomly within the room left over.

New draws are only ever added at the end, so existing seeds keep their large circles. The small circle's ranges were widened when Circle Trio became Circle Trio 1, so links from before then show it in a new spot. A test pins seed 48213.

### Circle Trio 2

`src/tools/circle-trio-2/layout.ts`:

1. **Sizes.** The large circle has a radius from 0.42 to 0.55. The first small one is 35% to 55% of that, and the second is within 20% of the first's size.
2. **First small circle.** A random angle around the large circle, and a random place across its edge: the centre is `R + k·r` from the large centre, with `k` from −1.5 to 1.5. At `k ≤ −1` it's fully inside, at `k ≥ 1` fully outside, and in between it crosses the edge.
3. **Second small circle.** Its centre is 0.75× to 1.25× the sum of the small radii from the first's, to a random side, so they overlap a little or leave a gap of at most a quarter of that. It gets its own `k`, within 1.2 of the first's so they sit at a similar depth, and capped below 1 when the first is fully outside, so the two are never both outside. The angle between them comes from the law of cosines.
4. **Placement.** The same `placeInFrame` as Circle Trio 1, which is what puts the large circle somewhere random on the canvas.

Each small circle ends up inside about 15% of the time, across the edge 73% and outside 12%. A test pins seed 48213.

Both tools draw with `drawCircles.ts`, which leaves the canvas clear so the paper colour behind it shows, then draws each circle at the chosen opacity, large ones first. The canvas blends each fill over what's below, so overlaps darken without any extra maths. Outlines and center dots are drawn on top at full strength.

---

## How the Box Randomizer works

The cube's geometry is in `src/math/cube.ts`, and it's all derived from one numbering. Corner `i` (0 to 7) sits at ±1/√3 on each axis, with bit 0 of `i` choosing +x, bit 1 +y and bit 2 +z. That puts every corner on the unit sphere, the same size as the Sphere Randomizer's sphere.

- **12 edges.** Two corners share an edge when they differ in exactly one coordinate, which is one bit of their index, so the edges are every `[i, i | bit]` where that bit isn't already set.
- **6 faces.** Each face fixes one bit (its axis and side) and walks the other two bits in the order 00, 01, 11, 10, so consecutive corners always share an edge.

`quatFromSeed` (`src/tools/box-randomizer/pose.ts`) takes the first three draws of `mulberry32(seed)` and turns them into a rotation with `randomQuat`, exactly as the Sphere Randomizer does. `drawBox.ts` then:

1. **Rotates** the 8 corners and the 6 face normals with `rotate`.
2. **Projects** each corner to the screen. With perspective on, the eye sits 5 units in front of the centre and a point at depth `z` is scaled by `5 / (5 − z)`, so near corners grow and far ones shrink, while anything at depth 0 keeps its size. With it off, depth is simply dropped.
3. **Finds the faces that point at you.** In the flat view that's a face whose normal has z > 0. In perspective it's a face whose normal points toward the eye from a corner of that face, which can differ from the flat test for a face that is nearly edge-on. You always see one, two or three faces, never both faces of one axis, and a test checks that over 500 random rotations.
4. **Draws** the faces you see (they never overlap, so order doesn't matter), then the hidden edges faintly, then the front edges on top. An edge is in front when either face beside it is seen.

Center lines join the midpoints of a face's opposite edges. Under perspective, the midpoint of the edge in 3D is not the midpoint of its drawing, which is exactly why these lines are worth practicing: the cross lands at the face's true centre.

---

## How the Cylinder Randomizer works

The geometry is in `src/math/cylinder.ts`. A cylinder has an axis (a unit vector), two unit vectors `u` and `v` at right angles to it, a radius and a half-length. The point at angle φ on a rim is `centre + radius·(cos φ·u + sin φ·v)`. The radius and half-length are chosen so that `radius² + halfLength² = 1`, which puts the rims on the unit sphere and makes every cylinder the same overall size as the sphere and the cube.

`poseFromSeed` (`src/tools/cylinder-randomizer/pose.ts`) takes the first three draws of `mulberry32(seed)` for the rotation, exactly as the other two tools do, and the fourth for the proportions (length over diameter, from 0.5 to 3, spread evenly on a log scale so squat and long cylinders are equally likely). `drawCylinder.ts` then works out:

1. **Where the side lines go.** The side's outward normal at angle φ is `n = cos φ·u + sin φ·v`. In a flat view the side faces you where `n.z > 0`; in perspective, with the eye at `(0, 0, 5)`, it faces you where `n · eye > radius`. Both have the form `ρ cos(φ − base) > k`, so the side faces you for φ in `base ± acos(k / ρ)`. The two ends of that range are the silhouette, and the straight side lines run along the cylinder at those two angles, touching both ellipses (a test checks they really are tangent).
2. **Which end faces you**, with the same test the Box Randomizer uses for a face. At most one end does; seen side-on in perspective, neither does. Looking straight down the axis in perspective, the side faces away all the way round and only the near end shows.
3. **Draws** the side as the strip between the two rims' front halves, then the end that faces you on top, then the back half of the far rim faintly, then the side lines and every rim edge you can see. A rim is in front where its end faces you or the side next to it does, the same rule as a cube's edges.

The ellipses come from projecting each rim point by point (120 per rim), so they are exact in both views. In the flat view you can check the classic rules against the drawing: the long half-axis of each ellipse is the radius, the short one is the radius times how directly that end faces you, and the short one lies along the cylinder's axis. The center lines show the two diameters that become those axes. In perspective the drawn ellipse's own axes drift a little away from them, and the cross is no longer in the middle of the ellipse, for the same reason the Box Randomizer's center lines aren't.

**Ellipse axes.** The major and minor axes are those of the ellipse actually drawn, in both views, so in perspective they are not the center lines. `projectedCircle` (`src/math/ellipse.ts`) gets them exactly. Perspective projection takes the rim's `(cos φ, sin φ, 1)` to screen coordinates with one 3×3 matrix `M`, so the unit circle `x² + y² = 1` becomes a conic on screen, `adj(M)ᵀ·diag(1, 1, −1)·adj(M)`. The ellipse's centre is where that conic's gradient is zero, and its axes are the eigenvectors of the conic's top-left 2×2 block, the longer axis going with the smaller eigenvalue. The determinant of that block and the conic's value at the centre come straight from `M`, which keeps thin, nearly edge-on ellipses accurate. A test checks that every projected rim point lies on the ellipse, and that in a flat view the minor axis lines up with the cylinder's axis and the major axis is the radius. The Cone Randomizer draws its base's axes the same way (`src/tools/shared/ellipseAxes.ts`).

**Uniform size.** With the option on, the drawing uses a length-to-diameter ratio of 2 (`UNIFORM_PROPORTION` in `cylinder.ts`) instead of the seed's. The seed still picks a proportion, so a shared link shows the same cylinder whichever way the option is set.

---

## How the Cone Randomizer works

The geometry is in `src/math/cone.ts` and builds on the cylinder's. A cone has the same axis, `u`, `v`, radius and half-length as a cylinder of the same proportions, with the base centred at `−halfLength` along the axis and the apex at `+halfLength`. The base rim sits on the unit sphere, so a cone is a cylinder with one end shrunk to a point, and the rim points come from the cylinder's `rimPoint`. `poseFromSeed` draws the rotation and proportions exactly as the Cylinder Randomizer does, so a seed gives both the same pose.

1. **Where the side lines go.** Along the straight line from the rim at angle φ up to the apex, the side's outward normal is `n = height·(cos φ·u + sin φ·v) + radius·axis`. In a flat view the side faces you where `n.z > 0`. In perspective it faces the eye at `(0, 0, 5)` where `n · eye > radius·halfLength`, because `n · p` is that same number at every point `p` on the line. As with the cylinder, both have the form `ρ cos(φ − base) > k`, so the side faces you for φ in `base ± acos(k / ρ)`, and the side lines run from the rim at those two angles to the apex. A test checks they really are tangent to the drawn ellipse, in both views. Unlike the cylinder's, the range can be empty (you're facing the base and the apex is hidden behind it) or a full turn (you're looking down on the apex and the base is hidden underneath), and then there are no side lines at all.
2. **Whether the base faces you**, with the Box Randomizer's face test.
3. **Draws** the side as the apex joined to the front of the rim, the base on top when it faces you, the back of the rim faintly when it doesn't, then the side lines and every rim edge you can see.

---

## How the Lit Sphere works

The scene is in `src/math/light.ts`: a unit sphere at the origin sitting on a floor at y = −1, seen without perspective by a viewer looking 20° down so the floor shows. The light is distant, like the sun, so it's just a direction.

`lightFromSeed` (`src/tools/lit-sphere/pose.ts`) takes three draws of `mulberry32(seed)`: which side, how far round from the viewer (30° to 150°), and how high (30° to 65°). Lower than 30° and the shadow would run off the canvas. The drawing is then fitted to the canvas around the sphere, the whole cast shadow and the sun, so the sphere moves and shrinks a little from pose to pose.

`drawLitSphere.ts` works out every pixel, as the Sphere Randomizer does for its sectors. A pixel on the sphere gets its outward normal `n`; any other pixel gets the floor point behind it. The shading (`shading.ts`) is a small model of what artists are taught to see:

- **Light side** (`n · light > 0`): brighter the more it faces the light, plus a highlight where `n` points halfway between the light and the viewer.
- **Shadow side**: dark, except for **reflected light** from a low light source on the side away from the light, like light bouncing off the floor. The **core shadow** is where that bounce doesn't reach, just past the terminator. The two sides meet in a soft step at the terminator, and the brightest reflected light is kept darker than the darkest halftone, the rule that keeps the light and shadow families apart (a test checks it for several lights).
- **Floor**: lit at a value set by the light's height. A floor point is in the **cast shadow** when the line from it toward the light passes through the sphere. The shadow's edge is crisp near the sphere and gets softer further away, and the **occlusion** shadow darkens the floor right around the contact point.

The terminator is the circle on the sphere at right angles to the light. Since it is also the sphere's outline as seen from the light, sliding each of its points along the light down to the floor gives the exact edge of the cast shadow. Tests check that every terminator point is at right angles to the light and every shadow-edge point is exactly at the edge of the shadow.

**Flat value zones** gives each zone (highlight, light, halftone, core shadow, reflected light, lit floor, cast shadow, occlusion) one value, from `ZONE_VALUES`. **Color** keeps the same values and tints them warm in the light and cool in the shadow.

---

## How the Value Study works

A photo is decoded with `createImageBitmap`, which also turns phone photos upright from their EXIF orientation. It's kept in memory for the tab (`usePhoto.ts`); nothing is sent anywhere. Pictures are `Picture`s (`picture.ts`): something with an aspect ratio that can give its pixels at a size. A photo gets them by drawing itself onto a canvas that size; the sample works them out with the Lit Sphere's own shading, so it needs no canvas, which lets the home-page thumbnail and the tests draw it too.

`drawValueStudy.ts` fits the picture on the canvas and processes it at the canvas's real resolution, in physical pixels, so it stays sharp in full screen. The steps, all in `src/math/values.ts` and tested there:

1. **Lightness**: each pixel's CIE L\* lightness, 0 (black) to 100 (white), from its sRGB color. L\* is used rather than plain RGB because equal steps in it look equal to the eye, and it sees green as much lighter than blue, as we do. Grayscale shows this value as a gray.
2. **Stretch** (if on): the darkest 1% and the lightest 1% are clipped, and everything between is spread over 0 to 100.
3. **Simplify**: two box blurs in each direction, which look like a Gaussian blur and cost the same at any radius. The radius is measured on the 480-unit canvas and scaled with it, so the thumbnail and full screen simplify the same amount.
4. **Grouping**: 0 to 100 is cut into 3, 5 or 7 equal bands, and each band is drawn as one gray, evenly spaced from black to white like a printed value scale. The swatches count how many pixels fall in each band.
5. **Outlines**: a pixel is on an outline when the pixel to its right or below it is in another band.

---

## How the Perspective Grid works

The grid is a real camera looking at a world of boxes: the eye sits at the origin, y points up, and every box edge runs along x, y or z. `src/math/perspective.ts` holds the camera (a turn, a tilt, the eye's distance from the picture, and the center of vision) and projects points and directions onto the picture. A direction's **vanishing point** is where a line from the eye in that direction meets the picture; directions parallel to the picture have none, which is why 1 point perspective keeps x and y lines parallel and 2 point keeps verticals vertical.

`pose.ts` picks the vanishing points on the picture first, the way you'd place them on paper, and works out the camera that sees them:

- **1 point**: the point is the center of vision, and the camera looks straight along z.
- **2 point**: the two points are 0.9 to 2 canvas widths apart on the horizon, with one on the canvas and the canvas's middle between them. x and z are at right angles, which fixes the eye's distance: if the center of vision is a and b from the two points, the distance is √(a·b).
- **3 point**: the third point is straight above the center of vision when looking up (worm's eye) and below it when looking down (bird's eye). The center of vision is then the orthocenter of the three points, where the triangle's altitudes cross, and the tilt and distance follow from that.

Tests check the round trip: the camera built for some points puts its vanishing points exactly there, and the lines of a box, projected, really meet at them.

The number of points is `seed % 3 + 1`. Choosing a number in the options moves to the nearest seed that has it, and `useSeedSession` takes an optional `fit` so Randomize and the timer only pick such seeds. A typed or shared seed is always shown as it is.

The guide lines from a point are evenly spaced in angle, with one along the horizon (or, for the third point, the vertical). From a point on the canvas they go all the way round; from a point off it they fan across the angle the canvas covers, so a far point still gives about the same number of lines across the picture.

## How the Form Combo works

Each form is one of the unit forms the randomizers draw (a sphere of radius 1, a cube with its corners on the unit sphere, a cylinder or cone with its rims on it), turned by a random quaternion, then scaled and moved into place. `src/math/solids.ts` holds these placed **solids** and the three things the tool needs to know about each:

- **Inside or out**: a number that is negative inside the form and positive outside, about the distance to the surface. For a box it is how far the farthest coordinate is past the half edge; for a cylinder, the larger of how far you are outside the tube and past the caps.
- **Where a ray goes through it**: each form is the overlap of a few simple pieces (slabs between two planes, a round tube, a cone), so a ray's span inside the form is the overlap of its spans in each piece, and the piece it enters last is the face it comes in through.
- **Its surface as patches**: a grid over the sphere, each face of the box, the cylinder's side and caps, the cone's side and base, spaced evenly by area.

**Placing the forms** (`pose.ts`): the seed shuffles the forms, then places each one partway into one already placed, in a random direction squashed toward the screen so they sit side by side more than behind each other. A layout is checked three ways: each form must cross the one it was attached to (some of its surface inside it, measured on the patch grid), no form may have more than 40% of its surface inside another, and each must show at least 45% as much as it would alone, from a small test render. A layout that fails is thrown away for the next draws from the seed's stream, so a seed always ends at the same layout. Last, the scene is moved and scaled to fit the unit sphere, like the single forms.

**Where forms meet** (`src/math/meet.ts`): for each pair, walk the grid over one form's surface and look at the other's inside-or-out number at each point. It changes sign where the surface goes into the other form. In each grid cell whose corners disagree, the crossing on each edge is found by halving the edge until it sits on the other surface, and the crossings are joined (marching squares). Every point found lies on both surfaces.

**Drawing** (`drawFormCombo.ts`):

1. **Fills**: for every pixel, the ray from the eye meets each form's span, and the nearest one gives the color (and for the box, the face). Only forms whose outline could cover the pixel are checked. Working pixel by pixel is what makes forms going into each other look right, which painting whole shapes back to front can't do.
2. **Lines**: each form's outline (the sphere's silhouette circle, the box's edges, the rims, and the side lines from `frontArc` in `cylinder.ts` and `cone.ts`, which now take where the eye is relative to a form off to one side) and the lines where forms meet, as points in the scene.
3. **Hiding**: a point is hidden when the way from it to the eye passes through any form, its own included. Lines are split into seen and hidden pieces at each point, then the hidden ones are drawn faintly underneath and the seen ones on top, each set as one path.

The drawing is scaled to fill the canvas from where its lines land on screen, so a pose fills it however the forms are spread.

---

## Project structure

```
.github/workflows/ci.yaml CI: lint, tests and build on every push and pull request
index.html                HTML shell; Vite's entry point
public/
  favicon.svg             Browser tab icon
src/
  main.tsx, App.tsx       Entry point and routes (one route per registered tool)
  site/                   Site shell: layout and nav, the theme button, home page, tool page (with full screen), 404, site name
  shortcuts/              Keyboard shortcuts: the registry, useShortcuts, and the ? list
  practice/               Practice sessions: the list of steps and presets, running them, and the summary
  worksheet/              Printable worksheets: the page, its layout in millimetres, and the print styles
  tools/
    registry.ts           The list of tools; drives routes, nav and home-page cards (with live thumbnails)
    shared/               Shared components and utilities: session controls, the timer's ring and chime, pose history and favorites, the practice session's hook into the timer, the Display options panel, canvas sizing and PNG download, paper and ink colours for dark mode, ellipse axes
    sphere-randomizer/    Sphere Randomizer component, drawing, seeds, palettes, options, timer
    circle-trio/          Circle Trio 1 component and layout, plus the drawing and options both Circle Trios use
    circle-trio-2/        Circle Trio 2 component and layout
    box-randomizer/       Box Randomizer component, drawing, seeds, options
    cylinder-randomizer/  Cylinder Randomizer component, drawing, seeds, options
    cone-randomizer/      Cone Randomizer component, drawing, seeds, options
    lit-sphere/           Lit Sphere component, drawing, shading model, light from a seed, options
    value-study/          Value Study component, opening photos, the sample picture, drawing, options
    perspective-grid/     Perspective Grid component, the grid from a seed, drawing, options
    form-combo/           Form Combo component, placing the forms from a seed, drawing, options
  math/                   Reusable math with no UI dependencies
    quat.ts               Vectors, quaternions, Shoemake random rotation
    random.ts             mulberry32 seeded PRNG
    sphere.ts             Great circles, sectors, projection, visibility, intersections
    cube.ts               Cube corners, edges and faces, perspective projection, which faces you see
    cylinder.ts           Cylinder proportions, rims, side lines, and the diameters behind each ellipse's axes
    ellipse.ts            The exact centre and major and minor axes of a circle's ellipse on screen
    cone.ts               Cone shape, side normals, and where the side lines touch the base
    light.ts              The Lit Sphere's scene: the view, the floor, the light, the terminator and the cast shadow
    values.ts             Value studies: L* lightness, blur, stretching, grouping into values, outlines
    perspective.ts        Perspective cameras: vanishing points, the horizon, the camera for given points, guide-line fans
    solids.ts             Placed forms: inside or out, where a ray goes through them, their surfaces as patches
    meet.ts               Where two forms' surfaces meet, and how much of one is inside another
```

## Getting started

Requires Node.js and npm.

```bash
npm install
npm run dev       # start the dev server
npm test          # run the Vitest suite
npm run lint      # lint with Oxlint
npm run format    # format with Prettier
npm run format:check  # check formatting without writing
npm run build     # type-check and build to dist/
npm run preview   # serve the production build locally
```

## Deployment

The site is a static single-page app. `vercel.json` rewrites every path to `index.html` so routes such as `/sphere-randomizer?seed=123` work when opened directly.

## Continuous integration

GitHub Actions runs lint, tests and the build on every push to `master` and on every pull request (`.github/workflows/ci.yaml`). The badge at the top of this README shows the latest result on `master`, and each pull request shows its own check, with the full log under **Details**.

Vercel deploys separately and doesn't wait for CI, so a red check is a warning rather than a block. Run the same checks locally before pushing with `npm run lint`, `npm test -- --run` and `npm run build`.
