import type { Circle, Vec2 } from '../../math/circles'
import { mulberry32, type Rng } from '../../math/random'
import { placeInFrame } from '../circle-trio/layout'

/** A random number between min and max, using one draw from the stream. */
const between = (rand: Rng, min: number, max: number) => min + (max - min) * rand()

/**
 * Where a small circle sits across the large one's rim, as k in `distance = R + k·r` from the
 * large centre: k ≤ −1 is fully inside, −1 < k < 1 crosses the rim, k ≥ 1 is fully outside.
 */
export const RIM_MIN = -1.5
export const RIM_MAX = 1.5
/** How far the second small circle's k can be from the first's, so they sit at a similar depth. */
export const RIM_SPREAD = 1.2

/** The small centres are this many times their combined radii apart: from overlapping a little
 * to a gap of a quarter of that. */
export const GAP_MIN = 0.75
export const GAP_MAX = 1.25

/**
 * Circle Trio 2: one large circle and two small ones of similar size close together on its rim. Each small one
 * can be inside, across the rim or outside, but never both outside. All sizes are in canvas
 * units. The draws happen in a fixed order, and new draws must only be added at the end, so a
 * seed always gives the same picture and shared links keep working.
 */
export function layoutFromSeed(seed: number): [Circle, Circle, Circle] {
    const rand = mulberry32(seed)

    // 1–3: sizes. The first small circle is 35% to 55% of the large one's radius, and the
    // second within a fifth of the first's.
    const radius = between(rand, 0.42, 0.55)
    const radius1 = radius * between(rand, 0.35, 0.55)
    const radius2 = radius1 * between(rand, 0.8, 1.2)

    // 4–5: the first small circle, at a random angle and a random place across the rim.
    const angle1 = between(rand, 0, 2 * Math.PI)
    const rim1 = between(rand, RIM_MIN, RIM_MAX)
    const dist1 = radius + rim1 * radius1

    // 6–8: the second one, close to the first and to a random side of it, at a similar place
    // across the rim. If the first is fully outside, the second stays at least partly over the
    // large circle.
    const gap = (radius1 + radius2) * between(rand, GAP_MIN, GAP_MAX)
    const side = rand() < 0.5 ? -1 : 1
    const rim2 = between(
        rand,
        Math.max(RIM_MIN, rim1 - RIM_SPREAD),
        Math.min(rim1 >= 1 ? 1 : RIM_MAX, rim1 + RIM_SPREAD),
    )
    const dist2 = radius + rim2 * radius2
    // The turn around the large centre that puts the two centres `gap` apart (law of cosines).
    // When their distances from the centre already differ by more than that, they line up.
    const cos = (dist1 * dist1 + dist2 * dist2 - gap * gap) / (2 * dist1 * dist2)
    const angle2 = angle1 + side * Math.acos(Math.min(1, Math.max(-1, cos)))

    const at = (dist: number, angle: number): Vec2 => [
        dist * Math.cos(angle),
        dist * Math.sin(angle),
    ]
    const circles: Circle[] = [
        { center: [0, 0], radius },
        { center: at(dist1, angle1), radius: radius1 },
        { center: at(dist2, angle2), radius: radius2 },
    ]

    // 9–10: fit the group in the frame.
    const [large, small1, small2] = placeInFrame(circles, rand)
    return [large, small1, small2]
}
