# Sphere Studio

Simple, browser-based drawing tools for art practice.

Sphere Studio is a small React + TypeScript site built with Vite. Each tool lives on its own page and is listed on the home page and in the site navigation. Everything runs in the browser: there is no backend, and nothing leaves the page except the links you choose to share.

## Contents

- [Tools](#tools)
  - [Sphere Randomizer](#sphere-randomizer)
  - [Adding a tool](#adding-a-tool)
- [How the Sphere Randomizer works](#how-the-sphere-randomizer-works)
  - [Random rotations with quaternions](#random-rotations-with-quaternions)
  - [The sphere and its eight sectors](#the-sphere-and-its-eight-sectors)
  - [Drawing](#drawing)
  - [Seeds and shareable poses](#seeds-and-shareable-poses)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Deployment](#deployment)

---

## Tools

| Tool | Route | What it's for |
| --- | --- | --- |
| [Sphere Randomizer](#sphere-randomizer) | `/sphere-randomizer` | Practice drawing a sphere in any orientation |
<!-- Add one row per new tool. -->

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

<!--
### Tool name

**Route:** `/tool-slug` · **Source:** `src/tools/tool-slug/`

One or two sentences on what the tool is for.

**Features**

- …

If the tool has non-obvious internals, add a "How <Tool name> works" section
further down and link to it from here.
-->

### Adding a tool

Tools are driven by one registry, `src/tools/registry.ts`. Adding an entry there gives the tool its route, nav link, and home-page card automatically.

1. Create a folder `src/tools/<slug>/` with a component that takes no props, for example `MyTool.tsx`. Keep tool-specific logic and styles in that folder; put reusable math in `src/math/`.
2. Register it in `src/tools/registry.ts`:

   ```ts
   {
       slug: 'my-tool',          // served at /my-tool; lowercase words joined by hyphens
       name: 'My Tool',
       description: 'One sentence for the home-page card.',
       component: MyTool,
   },
   ```

3. Add unit tests next to the code (`*.test.ts`). `src/tools/registry.test.ts` already checks that slugs are unique and URL-safe and that every tool has a name and description.
4. Document it in this README: add a row to the [Tools](#tools) table and copy the commented-out template under the Sphere Randomizer section.

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

Every pose comes from a single integer **seed** from 0 to 999,999 (`seed.ts`), short enough to type or read aloud. The seed is the single source of truth for what's on screen.

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

Tests in `seed.test.ts` check parsing, determinism, unit length, that consecutive seeds spread evenly across all eight sectors and marker picks spread evenly, and that share URLs round-trip.

---

## Project structure

```
index.html                HTML shell; Vite's entry point
public/
  favicon.svg             Browser tab icon
src/
  main.tsx, App.tsx       Entry point and routes (one route per registered tool)
  site/                   Site shell: layout and nav, home page, tool page, 404, site name
  tools/
    registry.ts           The list of tools; drives routes, nav and home-page cards
    sphere-randomizer/    Sphere Randomizer component, drawing, seeds, palettes, options, timer
  math/                   Reusable math with no UI dependencies
    quat.ts               Vectors, quaternions, Shoemake random rotation
    random.ts             mulberry32 seeded PRNG
    sphere.ts             Great circles, sectors, projection, visibility, intersections
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
