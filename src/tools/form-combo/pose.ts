import { proportionFromPick, UNIFORM_PROPORTION } from '../../math/cylinder'
import { meetLine, shareInside, type Segment } from '../../math/meet'
import { randomQuat, type Vec3 } from '../../math/quat'
import { mulberry32, type Rng } from '../../math/random'
import { span, type Solid, type SolidKind } from '../../math/solids'

export type FormsChoice = 'three' | 'two' | 'four'

/** Distance from the scene's centre to the eye, the same as the other randomizers'. */
export const CAMERA_DISTANCE = 5

/** The forms in a pose and the lines where they meet, all in scene units. */
export interface Combo {
    solids: readonly Solid[]
    /** Where each pair of forms meets, as short segments. */
    meets: readonly Segment[]
}

/** Grid steps around a round form when tracing where forms meet. */
const MEET_DETAIL = 160
/** Coarser grids for checking a layout, which only needs rough shares. */
const CHECK_DETAIL = 28
const CHECK_PIXELS = 40

/** Attempts at a layout before settling for the best one found. */
const MAX_ATTEMPTS = 40

/** The most of a form's surface that may be inside another, so none gets swallowed. */
const MAX_SHARE_INSIDE = 0.4
/** The least of a form's surface that must be inside the form it's attached to. */
const MIN_SHARE_INSIDE = 0.06
/** How much of a form must still show, compared with on its own, so none hides behind another. */
const MIN_SHARE_SEEN = 0.45

/** How big each form is, as a range of `scale` (the radius of the sphere it fits in). */
const SCALES: Record<SolidKind, readonly [number, number]> = {
    sphere: [0.75, 0.95],
    box: [0.85, 1.1],
    cylinder: [0.95, 1.2],
    cone: [0.95, 1.2],
}

/** About how far a form reaches from its centre, as a share of its scale, for spacing them. */
const REACH: Record<SolidKind, number> = { sphere: 1, box: 0.75, cylinder: 0.7, cone: 0.65 }

const NAMES: Record<SolidKind, string> = {
    sphere: 'sphere',
    box: 'box',
    cylinder: 'cylinder',
    cone: 'cone',
}

/** The forms a choice uses. For two, the seed picks the pair. */
function kindsFor(forms: FormsChoice, rand: Rng): SolidKind[] {
    const three: SolidKind[] = ['sphere', 'box', 'cylinder']
    if (forms === 'three') return three
    if (forms === 'four') return [...three, 'cone']
    const left = Math.min(2, Math.floor(rand() * 3))
    return three.filter((_, i) => i !== left)
}

/** A random direction, flattened toward the screen so forms sit beside each other more than behind. */
function sidewaysDirection(rand: Rng): Vec3 {
    for (;;) {
        const d: Vec3 = [2 * rand() - 1, 2 * rand() - 1, (2 * rand() - 1) * 0.5]
        const len = Math.hypot(...d)
        if (len > 0.1 && len <= 1) return [d[0] / len, d[1] / len, d[2] / len]
    }
}

/** One try at a layout: each form in turn pushed partway into one placed before it. */
function layout(
    kinds: readonly SolidKind[],
    rand: Rng,
    uniform: boolean,
): { solids: Solid[]; anchors: number[] } {
    const order = [...kinds]
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1))
        ;[order[i], order[j]] = [order[j], order[i]]
    }
    const solids: Solid[] = []
    const anchors: number[] = []
    for (const kind of order) {
        const q = randomQuat(rand)
        // The pick is drawn either way, so uniform size keeps the rest of the pose's draws.
        const pick = proportionFromPick(rand())
        const proportion = uniform ? UNIFORM_PROPORTION : pick
        const [lo, hi] = SCALES[kind]
        const scale = lo + (hi - lo) * rand()
        let centre: Vec3 = [0, 0, 0]
        if (solids.length > 0) {
            const anchor = Math.min(solids.length - 1, Math.floor(rand() * solids.length))
            const other = solids[anchor]
            const dir = sidewaysDirection(rand)
            // Far enough apart that neither swallows the other, close enough that they cross.
            const gap =
                (REACH[kind] * scale + REACH[other.kind] * other.scale) * (0.5 + 0.25 * rand())
            centre = [
                other.centre[0] + dir[0] * gap,
                other.centre[1] + dir[1] * gap,
                other.centre[2] + dir[2] * gap,
            ]
            anchors.push(anchor)
        }
        solids.push({ kind, centre, scale, q, proportion })
    }
    return { solids, anchors }
}

/** Moves and scales the scene so it fits in the unit sphere around the origin. */
function normalize(solids: readonly Solid[]): Solid[] {
    const mid: Vec3 = [0, 1, 2].map(
        (i) => solids.reduce((sum, s) => sum + s.centre[i], 0) / solids.length,
    ) as unknown as Vec3
    const radius = Math.max(
        ...solids.map(
            (s) =>
                Math.hypot(s.centre[0] - mid[0], s.centre[1] - mid[1], s.centre[2] - mid[2]) +
                s.scale,
        ),
    )
    return solids.map((s) => ({
        ...s,
        centre: [
            (s.centre[0] - mid[0]) / radius,
            (s.centre[1] - mid[1]) / radius,
            (s.centre[2] - mid[2]) / radius,
        ],
        scale: s.scale / radius,
    }))
}

/**
 * How much of each form shows in a small perspective view of the scene, as a share of what
 * would show with the others gone.
 */
export function sharesSeen(solids: readonly Solid[]): number[] {
    const seen = solids.map(() => 0)
    const alone = solids.map(() => 0)
    const eye: Vec3 = [0, 0, CAMERA_DISTANCE]
    for (let i = 0; i < CHECK_PIXELS; i++) {
        for (let j = 0; j < CHECK_PIXELS; j++) {
            const x = ((i + 0.5) / CHECK_PIXELS) * 2.6 - 1.3
            const y = ((j + 0.5) / CHECK_PIXELS) * 2.6 - 1.3
            const d: Vec3 = [x, y, -CAMERA_DISTANCE]
            let nearest = -1
            let nearestT = Infinity
            solids.forEach((s, k) => {
                const hit = span(s, eye, d)
                if (!hit) return
                alone[k]++
                if (hit.t0 < nearestT) {
                    nearestT = hit.t0
                    nearest = k
                }
            })
            if (nearest >= 0) seen[nearest]++
        }
    }
    return seen.map((n, k) => (alone[k] ? n / alone[k] : 0))
}

/**
 * How far a layout is from what we want, 0 when it is fine: each form crosses the one it was
 * attached to, none is mostly inside another, and each shows well enough.
 */
function faults(solids: readonly Solid[], anchors: readonly number[]): number {
    let bad = 0
    for (let a = 0; a < solids.length; a++) {
        for (let b = 0; b < solids.length; b++) {
            if (a === b) continue
            const share = shareInside(solids[a], solids[b], CHECK_DETAIL)
            if (share > MAX_SHARE_INSIDE) bad += share - MAX_SHARE_INSIDE
            // Forms 1, 2 and so on were each attached to one before them.
            const attached = anchors[a - 1] === b || anchors[b - 1] === a
            if (attached && share < MIN_SHARE_INSIDE) bad += MIN_SHARE_INSIDE - share + 0.01
        }
    }
    if (bad > 0) return bad
    for (const share of sharesSeen(solids)) {
        if (share < MIN_SHARE_SEEN) bad += MIN_SHARE_SEEN - share
    }
    return bad
}

/**
 * The forms and their placement for a seed: random sizes, turns and proportions, placed so
 * each one runs into another. Every draw comes from the seed's stream, and a layout that
 * doesn't work is thrown away for the next draws, so a seed always gives the same pose.
 * With `uniform` on, cylinders and cones are all twice as long as they are wide, as with
 * "Uniform size" on the Cylinder and Cone Randomizers.
 */
export function comboFromSeed(seed: number, forms: FormsChoice, uniform = false): Combo {
    const rand = mulberry32(seed)
    const kinds = kindsFor(forms, rand)
    let best: { solids: Solid[]; score: number } | null = null
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const { solids, anchors } = layout(kinds, rand, uniform)
        const placed = normalize(solids)
        const score = faults(placed, anchors)
        if (!best || score < best.score) best = { solids: placed, score }
        if (score === 0) break
    }
    const solids = best!.solids
    const meets: Segment[] = []
    for (let a = 0; a < solids.length; a++) {
        for (let b = a + 1; b < solids.length; b++) {
            meets.push(...meetLine(solids[a], solids[b], MEET_DETAIL))
        }
    }
    return { solids, meets }
}

/** "Sphere, box and cylinder", in the order the forms were placed. */
export function describeForms(solids: readonly Solid[]): string {
    const names = solids.map((s) => NAMES[s.kind])
    const text =
        names.length === 1
            ? names[0]
            : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
    return text[0].toUpperCase() + text.slice(1)
}
