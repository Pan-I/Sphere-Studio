# Sphere Studio

[![CI](https://github.com/Pan-I/Sphere-Studio/actions/workflows/ci.yaml/badge.svg)](https://github.com/Pan-I/Sphere-Studio/actions/workflows/ci.yaml)

Simple, browser-based drawing tools for art practice.

Sphere Studio is a small React + TypeScript site built with Vite. Each tool lives on its own page and is listed on the home page and in the site navigation. Everything runs in the browser: there is no backend, and nothing leaves the page except the links you choose to share.

## Contents

- [Tools](#tools)
  - [Sphere Randomizer](#sphere-randomizer)
  - [Circle Trio](#circle-trio)
  - [Box Randomizer](#box-randomizer)
  - [Cylinder Randomizer](#cylinder-randomizer)
  - [Keyboard shortcuts and full screen](#keyboard-shortcuts-and-full-screen)
  - [Adding a tool](#adding-a-tool)
- [How the Sphere Randomizer works](#how-the-sphere-randomizer-works)
  - [Random rotations with quaternions](#random-rotations-with-quaternions)
  - [The sphere and its eight sectors](#the-sphere-and-its-eight-sectors)
  - [Drawing](#drawing)
  - [Seeds and shareable poses](#seeds-and-shareable-poses)
- [How Circle Trio works](#how-circle-trio-works)
- [How the Box Randomizer works](#how-the-box-randomizer-works)
- [How the Cylinder Randomizer works](#how-the-cylinder-randomizer-works)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Deployment](#deployment)
- [Continuous integration](#continuous-integration)

---

## Tools

| Tool | Route | What it's for |
| --- | --- | --- |
| [Sphere Randomizer](#sphere-randomizer) | `/sphere-randomizer` | Generate a sphere to practice drawing a random face. |
| [Circle Trio](#circle-trio) | `/circle-trio` | Generate three circles to practice drawing a randome face.|
| [Box Randomizer](#box-randomizer) | `/box-randomizer` | Generate a cube in a random orientation to practice drawing boxes. |
| [Cylinder Randomizer](#cylinder-randomizer) | `/cylinder-randomizer` | Generate a cylinder in a random orientation and proportion to practice ellipses and the minor axis. |
<!-- Add one row per new tool. -->

---
### Sphere Randomizer

**Route:** `/sphere-randomizer` · **Source:** `src/tools/sphere-randomizer/`

A randomly rotated sphere split into eight sectors by three perpendicular great circles, with a timer and shareable poses, for form drawing practice.

**Features**

- **Randomize** shows a new, uniformly random orientation.
- **Timer**: set an interval (1 to 3600 seconds) and press Start; a new pose appears each time it runs out. Pause and Resume keep the remaining time, and any manual pose change restarts the countdown.
- **Seeds**: every pose has a seed from 0 to 999,999. The current seed is shown on the page and kept in the address bar as `?seed=…`, so the URL is always a link to the exact pose. **Copy link** copies it, and **Load seed** jumps to a seed you type in.
- **Display options** (saved in your browser between visits):
  - Shading: color, grayscale, or none (lines only)
  - Line thickness: 1 to 8 px
  - Show far-side lines: draws the hidden half of each circle faintly
  - Show center marker: a dot on one of the points where two circles cross, on the side facing you

How it works is covered in detail [below](#how-the-sphere-randomizer-works).

---

### Circle Trio

**Route:** `/circle-trio` · **Source:** `src/tools/circle-trio/`

Two large translucent circles and a smaller one roughly between them, in a new arrangement each time, for practicing overlapping forms.

**Features**

- **Randomize**, the **timer**, and **seeds** work exactly as in the Sphere Randomizer, with their own `?seed=` links.
- **Display options** (saved in your browser between visits):
  - Fill: color, grayscale, or none (outlines only)
  - Opacity: 15% to 60%
  - Line thickness: 1 to 8 px
  - Show outlines (always on when there is no fill)
  - Show centers: a dot at the middle of each circle

How the arrangement is chosen is covered [below](#how-circle-trio-works).

---

### Box Randomizer

**Route:** `/box-randomizer` · **Source:** `src/tools/box-randomizer/`

A cube in a random orientation, the other core form in drawing practice, with the faces that point at you shaded and the edges behind shown faintly.

**Features**

- **Randomize**, the **timer**, and **seeds** work exactly as in the Sphere Randomizer. A seed gives the cube the same rotation it gives the sphere.
- **Display options** (saved in your browser between visits):
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

- **Randomize**, the **timer**, and **seeds** work exactly as in the Sphere Randomizer. A seed gives the cylinder the same rotation it gives the sphere and the cube, and also picks its proportions: the length runs from half the diameter to three times it.
- **Display options** (saved in your browser between visits):
  - Shading: color, grayscale, or none (lines only). The side and the end facing you get different shades.
  - Line thickness: 1 to 8 px
  - Perspective: near parts look bigger, so the near end is a little larger than the far one. Off gives a flat view where the two ends are identical ellipses.
  - Show hidden edges: draws the back half of the far end faintly
  - Show axis: a dashed red line through the centres of both ends
  - Show center lines: a cross on each end through its true centre, along the diameters that become the ellipse's axes

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

### Keyboard shortcuts and full screen

Every tool page has these, so your hand can stay on the pencil:

| Key | What it does |
| --- | --- |
| <kbd>Space</kbd> | New pose |
| <kbd>P</kbd> | Start or pause the timer |
| <kbd>F</kbd> | Full screen on or off (<kbd>Esc</kbd> also leaves) |
| <kbd>?</kbd> | Show the list of shortcuts |

Shortcuts are ignored while you're typing in a field, and when Ctrl, Cmd or Alt is held, so browser shortcuts like Ctrl+P still work.

**Full screen** shows only the drawing and the timer, for a second screen beside your paper. It uses the browser's Fullscreen API. Where that isn't available (iPhone Safari), the tool fills the browser window instead.

On phones and tablets (touch only, no mouse or trackpad), the **Full screen** and **Shortcuts** buttons are hidden and <kbd>F</kbd> and <kbd>?</kbd> do nothing. `useTouchOnly` (in `src/site/`) decides this with the `(hover: none) and (pointer: coarse)` media query, so a tablet with a trackpad attached gets them back.

**For new tools and features:**

- **Adding a shortcut**: call `useShortcuts` from any component. The shortcut works while that component is on screen, is removed when it goes away, and appears in the <kbd>?</kbd> list automatically. If two components use the same key, the one that appeared most recently wins.

  ```tsx
  useShortcuts([{ key: 'd', description: 'Download PNG', run: downloadPng }])
  ```

- **Full screen**: wrapping is done by the tool page, so a new tool gets it for free. In full screen, only the tool's top-level elements marked `data-focus="show"` stay visible, and anything inside them marked `data-focus="hide"` is dropped. Mark your canvas with `data-focus="show"`. `SessionControls` already keeps the timer.
- **A sharp canvas at any size**: draw with `useSquareCanvas(SIZE, draw)` (in `src/tools/shared/`). It sizes the drawing buffer to the canvas's real size on screen, so it stays crisp in full screen, while `draw` keeps working in the same 0 to `SIZE` units.

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

3. Describe its display options in `src/tools/<slug>/displayOptions.ts` and the tool gets the **Display** panel, its defaults, and saving between visits for free. List one field per option with `defineOptions`; the panel shows them in that order. The shared presets keep common options identical across tools: `colorModeField` (color, grayscale or none), `lineWidthField` (1 to 8 px) and `toggleField` (a checkbox). A one-off option is a plain object, like Circle Trio's opacity:

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

   TypeScript checks the fields against the options type: every option needs a field, and a boolean must be a toggle, a number a range, and a string a choice. A field can grey itself out with `disabledWhen(options)`, as Circle Trio's opacity does when there is no fill. Stored values are checked field by field when they are loaded, so a missing, renamed or out-of-range value falls back to its default instead of breaking the tool.

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
- **Links.** The current seed is written to `?seed=…` with `history.replaceState`, keeping other URL parameters and the hash. On load, a valid `?seed=` takes priority over a random one. Invalid seeds (not a whole number, or out of range) are ignored.
- **What a seed doesn't include.** Display options (shading, line thickness, far-side lines, marker visibility) are personal preferences stored in `localStorage`, not part of the link, so a shared pose opens in each viewer's own style.

Tests in `pose.test.ts` check parsing, determinism, unit length, that consecutive seeds spread evenly across all eight sectors and marker picks spread evenly, and that share URLs round-trip.

## How Circle Trio works

The canvas spans −1 to 1 on both axes, with y pointing up. `layoutFromSeed` (`src/tools/circle-trio/layout.ts`) draws numbers from `mulberry32(seed)` in a fixed order:

1. **Sizes.** Large circle A has a radius from 0.38 to 0.48 and B from 0.28 to 0.38, so they are rarely the same size. The small circle is 35% to 55% of their average.
2. **Direction.** A random angle sets the line from A to B.
3. **Gap.** The centres are 0.55× to 1.10× the sum of the radii apart. Below 1× they overlap, which happens about 82% of the time.
4. **Small circle.** Its centre starts 30% to 70% of the way from A to B, then moves sideways off that line. In 65% of layouts it moves up to 0.6× its radius; in the other 35% it drifts 0.6× to 1.4×, to a random side.
5. **Placement.** The group is centred, then shifted randomly within the room left inside a 0.9 frame.

New draws are only ever added at the end, so existing seeds keep their layout. A test pins seed 48213.

Drawing (`drawCircles.ts`) fills a white background, then each circle at the chosen opacity, large ones first. The canvas blends each fill over what's below, so overlaps darken without any extra maths. Outlines and center dots are drawn on top at full strength.

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

---

## Project structure

```
.github/workflows/ci.yaml CI: lint, tests and build on every push and pull request
index.html                HTML shell; Vite's entry point
public/
  favicon.svg             Browser tab icon
src/
  main.tsx, App.tsx       Entry point and routes (one route per registered tool)
  site/                   Site shell: layout and nav, home page, tool page (with full screen), 404, site name
  shortcuts/              Keyboard shortcuts: the registry, useShortcuts, and the ? list
  tools/
    registry.ts           The list of tools; drives routes, nav and home-page cards (with live thumbnails)
    shared/               Shared components and utilities: session controls, the Display options panel, canvas sizing
    sphere-randomizer/    Sphere Randomizer component, drawing, seeds, palettes, options, timer
    circle-trio/          Circle Trio component, drawing, seeds, palettes, options, timer
    box-randomizer/       Box Randomizer component, drawing, seeds, options
    cylinder-randomizer/  Cylinder Randomizer component, drawing, seeds, options
  math/                   Reusable math with no UI dependencies
    quat.ts               Vectors, quaternions, Shoemake random rotation
    random.ts             mulberry32 seeded PRNG
    sphere.ts             Great circles, sectors, projection, visibility, intersections
    cube.ts               Cube corners, edges and faces, perspective projection, which faces you see
    cylinder.ts           Cylinder proportions, rims, side lines, and the diameters behind each ellipse's axes
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
