import { carvedFinder, insideCarved, type Carved } from '../../math/carve'
import { proportionFromPick, UNIFORM_PROPORTION } from '../../math/cylinder'
import { meetLine, shareInside, type Segment } from '../../math/meet'
import { randomQuat, type Vec3 } from '../../math/quat'
import { mulberry32, type Rng } from '../../math/random'
import { inside, surfacePatches, toWorld, type Solid, type SolidKind } from '../../math/solids'
import { CAMERA_DISTANCE } from '../form-combo/pose'

export { CAMERA_DISTANCE }

export type CutsChoice = 'one' | 'two'

/** A carved form and the lines where its cuts meet it, all in scene units. */
export interface Cutout extends Carved {
    /**
     * Where each cut breaks through the main form's surface (the rim of the hollow), and where
     * two cuts' hollows meet inside it, as short segments.
     */
    meets: readonly Segment[]
}

/** Grid steps around a round form when tracing where forms meet, as on the Form Combo. */
const MEET_DETAIL = 160
/** Coarser grids for checking a layout, which only needs rough shares. */
const CHECK_DETAIL = 28
const CHECK_PIXELS = 40
/** Cells along each side of the grid that checks the carved form is still in one piece. */
const CHECK_CELLS = 18

/** Attempts at a layout before settling for the best one found. */
const MAX_ATTEMPTS = 80

/** How much of a cut's surface must be inside the main form, so it takes a real bite... */
const MIN_CUT_INSIDE = 0.15
/** ...and how much at most, so it still breaks through the surface instead of hiding inside. */
const MAX_CUT_INSIDE = 0.7
/** The most of the main form's surface one cut may take away, so it stays recognisable. */
const MAX_REMOVED = 0.33
/** The most all the cuts together may take away. */
const MAX_REMOVED_TOTAL = 0.45
/** The least of the visible form each hollow must make up, so every cut faces you. */
const MIN_HOLLOW_SEEN: Record<CutsChoice, number> = { one: 0.12, two: 0.08 }
/** The least of the visible form the main form's own outside must make up. */
const MIN_OUTSIDE_SEEN = 0.4
/** The most two cuts may overlap, as a share of either one's surface inside the other. */
const MAX_CUTS_OVERLAP = 0.3
/** The share of the carved form allowed to break off from the biggest piece. */
const MAX_LOOSE = 0.02

/** The main form's size, as `scale`: the radius of the sphere it fits in. */
const MAIN_SCALE = 1
/**
 * A cut's size as a share of the main form's reach, so a slim cone or cylinder gets smaller
 * cuts than a sphere does.
 */
const CUT_SCALE: readonly [number, number] = [0.55, 0.9]

/** About how far a form reaches from its centre, as a share of its scale, for spacing them. */
const REACH: Record<SolidKind, number> = { sphere: 1, box: 0.75, cylinder: 0.7, cone: 0.65 }

const KINDS: readonly SolidKind[] = ['sphere', 'box', 'cylinder', 'cone']

const pickKind = (rand: Rng) => KINDS[Math.min(KINDS.length - 1, Math.floor(rand() * 4))]

/** Tries at finding a spot for a cut before taking the last one found. */
const SPOT_TRIES = 40
/** Two cuts aim at spots at least this far apart, as a share of the main form's reach. */
const MIN_SPOT_GAP = 0.8
/** A spot faces the eye when its surface turns at least this much toward it, as a cosine. */
const MIN_FACING = 0.25

/** A point on the form's surface, spread evenly by area, and which way the surface faces. */
function surfaceSpot(s: Solid, rand: Rng): { p: Vec3; n: Vec3 } {
    const patches = surfacePatches(s.kind, s.proportion, 16)
    const total = patches.reduce((sum, patch) => sum + patch.area, 0)
    let pick = rand() * total
    const patch = patches.find((pt) => (pick -= pt.area) < 0) ?? patches[patches.length - 1]
    const p = toWorld(s, patch.point(rand(), rand()))
    // Which way the surface faces: the way `inside` grows fastest.
    const h = 1e-4
    const g: Vec3 = [0, 1, 2].map((i) => {
        const q = [p[0], p[1], p[2]]
        const r = [p[0], p[1], p[2]]
        q[i] += h
        r[i] -= h
        return inside(s, q as unknown as Vec3) - inside(s, r as unknown as Vec3)
    }) as unknown as Vec3
    const len = Math.hypot(...g) || 1
    return { p, n: [g[0] / len, g[1] / len, g[2] / len] }
}

/**
 * A spot on the main form's surface for a cut to go in, on the side facing the eye, and away
 * from the spots taken already.
 */
function frontSpot(main: Solid, taken: readonly Vec3[], rand: Rng): { p: Vec3; n: Vec3 } {
    const eye: Vec3 = [0, 0, CAMERA_DISTANCE]
    let spot = surfaceSpot(main, rand)
    for (let i = 0; i < SPOT_TRIES; i++) {
        const { p, n } = spot
        const toEye: Vec3 = [eye[0] - p[0], eye[1] - p[1], eye[2] - p[2]]
        const facing = (n[0] * toEye[0] + n[1] * toEye[1] + n[2] * toEye[2]) / Math.hypot(...toEye)
        const apart = taken.every(
            (t) =>
                Math.hypot(t[0] - p[0], t[1] - p[1], t[2] - p[2]) >
                MIN_SPOT_GAP * REACH[main.kind] * main.scale,
        )
        if (facing > MIN_FACING && apart) break
        spot = surfaceSpot(main, rand)
    }
    return spot
}

/** One random form: kind, turn, proportion and size, centred on the origin. */
function randomSolid(kind: SolidKind, scale: number, rand: Rng, uniform: boolean): Solid {
    const q = randomQuat(rand)
    // The pick is drawn either way, so uniform size keeps the rest of the pose's draws.
    const pick = proportionFromPick(rand())
    return { kind, centre: [0, 0, 0], scale, q, proportion: uniform ? UNIFORM_PROPORTION : pick }
}

/** One try at a layout: the main form, and each cut pushed partway into it from the front. */
function layout(
    main: SolidKind,
    cutKinds: readonly SolidKind[],
    rand: Rng,
    uniform: boolean,
): Carved {
    const mainSolid = randomSolid(main, MAIN_SCALE, rand, uniform)
    const taken: Vec3[] = []
    const cuts = cutKinds.map((kind) => {
        const [lo, hi] = CUT_SCALE
        const size = REACH[main] * MAIN_SCALE * (lo + (hi - lo) * rand())
        const solid = randomSolid(kind, size, rand, uniform)
        const { p, n } = frontSpot(mainSolid, taken, rand)
        taken.push(p)
        // Centred near that spot, sunk in or standing out by part of the cut's size.
        const out = REACH[kind] * size * (0.7 * rand() - 0.35)
        return {
            ...solid,
            centre: [p[0] + n[0] * out, p[1] + n[1] * out, p[2] + n[2] * out] as Vec3,
        }
    })
    return { main: mainSolid, cuts }
}

/** Moves and scales the scene so the main form and its cuts fit in the unit sphere. */
function normalize({ main, cuts }: Carved): Carved {
    const all = [main, ...cuts]
    const mid: Vec3 = [0, 1, 2].map(
        (i) => all.reduce((sum, s) => sum + s.centre[i], 0) / all.length,
    ) as unknown as Vec3
    const radius = Math.max(
        ...all.map(
            (s) =>
                Math.hypot(s.centre[0] - mid[0], s.centre[1] - mid[1], s.centre[2] - mid[2]) +
                s.scale,
        ),
    )
    const fit = (s: Solid): Solid => ({
        ...s,
        centre: [
            (s.centre[0] - mid[0]) / radius,
            (s.centre[1] - mid[1]) / radius,
            (s.centre[2] - mid[2]) / radius,
        ],
        scale: s.scale / radius,
    })
    return { main: fit(main), cuts: cuts.map(fit) }
}

/**
 * What a small perspective view of the carved form shows: of the pixels it covers, the share
 * that is the main form's own outside, and the share that is each cut's hollow.
 */
export function sharesSeen(carved: Carved): { outside: number; hollows: number[] } {
    const pieces = carvedFinder(carved)
    const eye: Vec3 = [0, 0, CAMERA_DISTANCE]
    let total = 0
    let outside = 0
    const hollows = carved.cuts.map(() => 0)
    for (let i = 0; i < CHECK_PIXELS; i++) {
        for (let j = 0; j < CHECK_PIXELS; j++) {
            const x = ((i + 0.5) / CHECK_PIXELS) * 2.6 - 1.3
            const y = ((j + 0.5) / CHECK_PIXELS) * 2.6 - 1.3
            const [first] = pieces(eye, [x, y, -CAMERA_DISTANCE])
            if (!first) continue
            total++
            if (first.cut < 0) outside++
            else hollows[first.cut]++
        }
    }
    const share = (n: number) => (total ? n / total : 0)
    return { outside: share(outside), hollows: hollows.map(share) }
}

/**
 * The share of the carved form that has broken off from its biggest piece, from a grid of
 * points over the main form: 0 when it is all in one piece, as when a cut only bites into it,
 * more when a cut slices it in two.
 */
export function looseShare(carved: Carved): number {
    const n = CHECK_CELLS
    const { centre, scale } = carved.main
    const solid = new Uint8Array(n * n * n)
    const index = (i: number, j: number, k: number) => (i * n + j) * n + k
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            for (let k = 0; k < n; k++) {
                const at = (c: number, a: number) => c + scale * (((a + 0.5) / n) * 2 - 1)
                const p: Vec3 = [at(centre[0], i), at(centre[1], j), at(centre[2], k)]
                if (insideCarved(carved, p) < 0) solid[index(i, j, k)] = 1
            }
        }
    }
    // The size of each piece, by filling outward from each cell not yet reached.
    const seen = new Uint8Array(n * n * n)
    let total = 0
    let biggest = 0
    const stack: number[] = []
    for (let start = 0; start < solid.length; start++) {
        if (!solid[start] || seen[start]) continue
        let size = 0
        seen[start] = 1
        stack.push(start)
        while (stack.length) {
            const cell = stack.pop()!
            size++
            const k = cell % n
            const j = Math.floor(cell / n) % n
            const i = Math.floor(cell / (n * n))
            for (const [di, dj, dk] of [
                [1, 0, 0],
                [-1, 0, 0],
                [0, 1, 0],
                [0, -1, 0],
                [0, 0, 1],
                [0, 0, -1],
            ]) {
                const [a, b, c] = [i + di, j + dj, k + dk]
                if (a < 0 || b < 0 || c < 0 || a >= n || b >= n || c >= n) continue
                const next = index(a, b, c)
                if (solid[next] && !seen[next]) {
                    seen[next] = 1
                    stack.push(next)
                }
            }
        }
        total += size
        biggest = Math.max(biggest, size)
    }
    return total ? 1 - biggest / total : 1
}

/**
 * How far a layout is from what we want, 0 when it is fine: each cut takes a real bite and
 * breaks through the surface, the main form keeps most of itself and stays in one piece, and
 * every hollow faces the eye.
 */
function faults(carved: Carved, cutsChoice: CutsChoice): number {
    const { main, cuts } = carved
    let bad = 0
    let removed = 0
    cuts.forEach((c, i) => {
        const cutInside = shareInside(c, main, CHECK_DETAIL)
        if (cutInside < MIN_CUT_INSIDE) bad += MIN_CUT_INSIDE - cutInside + 0.01
        if (cutInside > MAX_CUT_INSIDE) bad += cutInside - MAX_CUT_INSIDE
        const taken = shareInside(main, c, CHECK_DETAIL)
        if (taken > MAX_REMOVED) bad += taken - MAX_REMOVED
        removed += taken
        for (const other of cuts.slice(i + 1)) {
            const overlap = Math.max(
                shareInside(c, other, CHECK_DETAIL),
                shareInside(other, c, CHECK_DETAIL),
            )
            if (overlap > MAX_CUTS_OVERLAP) bad += overlap - MAX_CUTS_OVERLAP
        }
    })
    if (removed > MAX_REMOVED_TOTAL) bad += removed - MAX_REMOVED_TOTAL
    if (bad > 0) return bad

    const { outside, hollows } = sharesSeen(carved)
    if (outside < MIN_OUTSIDE_SEEN) bad += MIN_OUTSIDE_SEEN - outside
    for (const share of hollows) {
        const least = MIN_HOLLOW_SEEN[cutsChoice]
        if (share < least) bad += least - share + 0.01
    }
    if (bad > 0) return bad

    const loose = looseShare(carved)
    return loose > MAX_LOOSE ? loose : 0
}

/** Each cut's rim, and where two cuts meet inside the main form. */
function meetsOf({ main, cuts }: Carved): Segment[] {
    const mid = ([a, b]: Segment): Vec3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
    const inAny = (p: Vec3, solids: readonly Solid[]) => solids.some((s) => inside(s, p) < 0)
    const meets: Segment[] = []
    cuts.forEach((c, i) => {
        const others = cuts.filter((_, j) => j !== i)
        // The rim, except where another cut has taken the main form's surface away too.
        for (const seg of meetLine(main, c, MEET_DETAIL)) {
            if (!inAny(mid(seg), others)) meets.push(seg)
        }
        // Where two hollows meet, the part inside the main form.
        for (const other of cuts.slice(i + 1)) {
            for (const seg of meetLine(c, other, MEET_DETAIL)) {
                if (inside(main, mid(seg)) < 0) meets.push(seg)
            }
        }
    })
    return meets
}

/**
 * The main form and its cuts for a seed: random kinds, sizes, turns and proportions, each cut
 * pushed into the main form from the side facing you. Every draw comes from the seed's stream,
 * and a layout that doesn't work is thrown away for the next draws, so a seed always gives the
 * same pose. With `uniform` on, cylinders and cones are all twice as long as they are wide.
 */
export function cutoutFromSeed(seed: number, cuts: CutsChoice, uniform = false): Cutout {
    const rand = mulberry32(seed)
    const main = pickKind(rand)
    const cutKinds = [pickKind(rand)]
    // Two different cuts, which also keeps out two slim cones, whose hollows hardly show.
    if (cuts === 'two') {
        const other = KINDS.filter((k) => k !== cutKinds[0])
        cutKinds.push(other[Math.min(other.length - 1, Math.floor(rand() * other.length))])
    }
    let best: { carved: Carved; score: number } | null = null
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const carved = normalize(layout(main, cutKinds, rand, uniform))
        const score = faults(carved, cuts)
        if (!best || score < best.score) best = { carved, score }
        if (score === 0) break
    }
    const carved = best!.carved
    return { ...carved, meets: meetsOf(carved) }
}

const NAMES: Record<SolidKind, string> = {
    sphere: 'sphere',
    box: 'box',
    cylinder: 'cylinder',
    cone: 'cone',
}

/** "Box with a sphere cut out of it", or "... with a cone and a cylinder cut out of it". */
export function describeCutout({ main, cuts }: Carved): string {
    const name = NAMES[main.kind]
    const article = (s: Solid) => `a ${NAMES[s.kind]}`
    const what = cuts.map(article).join(' and ')
    return `${name[0].toUpperCase()}${name.slice(1)} with ${what} cut out of it`
}
