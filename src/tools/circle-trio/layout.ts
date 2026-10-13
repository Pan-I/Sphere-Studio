import { bounds, lerp, type Circle, type Vec2 } from '../../math/circles'
import { mulberry32, type Rng } from '../../math/random'

/** Every circle stays inside this distance from the canvas centre (the canvas spans −1 to 1). */
export const FRAME = 0.9

/** How far past A's or B's centre the small circle can start, as a fraction of the gap. */
export const ALONG_OVERSHOOT = 0.25

/** A random number between min and max, using one draw from the stream. */
const between = (rand: Rng, min: number, max: number) => min + (max - min) * rand()

/**
 * Circle Trio 1: two large circles (A bigger than B, most of the time) and a small one near the
 * line between them, anywhere from a little before A's centre to a little past B's.
 * All sizes are in canvas units. The draws happen in a fixed order, and new draws must only
 * be added at the end, so a seed always gives the same picture and shared links keep working.
 */
export function layoutFromSeed(seed: number): [Circle, Circle, Circle] {
    const rand = mulberry32(seed)

    // 1–3: sizes. A and B come from ranges that only meet at 0.38, so they rarely match.
    const radiusA = between(rand, 0.38, 0.48)
    const radiusB = between(rand, 0.28, 0.38)
    const radiusS = ((radiusA + radiusB) / 2) * between(rand, 0.35, 0.55)

    // 4: direction from A to B, and its sideways direction (turned 90°).
    const angle = between(rand, 0, 2 * Math.PI)
    const along: Vec2 = [Math.cos(angle), Math.sin(angle)]
    const sideways: Vec2 = [-along[1], along[0]]

    // 5: distance between the large centres. Below 1× the sum of radii, they overlap.
    const gap = (radiusA + radiusB) * between(rand, 0.55, 1.1)
    const centerA: Vec2 = [0, 0]
    const centerB: Vec2 = [along[0] * gap, along[1] * gap]

    // 6–9: the small circle. Start somewhere along the line from A to B, which can be up to a
    // quarter of the gap past either centre...
    const onLine = lerp(centerA, centerB, between(rand, -ALONG_OVERSHOOT, 1 + ALONG_OVERSHOOT))
    // ...then push it sideways: usually a little, sometimes (35%) a long way.
    const drifts = rand() < 0.35
    const amount = drifts ? between(rand, 1.8, 4.2) : between(rand, 0, 1.8)
    const side = rand() < 0.5 ? -1 : 1
    const push = side * amount * radiusS
    const centerS: Vec2 = [onLine[0] + sideways[0] * push, onLine[1] + sideways[1] * push]

    const circles: [Circle, Circle, Circle] = [
        { center: centerA, radius: radiusA },
        { center: centerB, radius: radiusB },
        { center: centerS, radius: radiusS },
    ]

    // 10–11: fit the group in the frame.
    const [a, b, s] = placeInFrame(circles, rand)
    return [a, b, s]
}

/**
 * Centres the circles on the canvas, shrinks them if they don't fit inside FRAME, then shifts them
 * randomly within the room left over. Uses two draws, for the x and y shift.
 */
export function placeInFrame(circles: readonly Circle[], rand: Rng): Circle[] {
    const box = bounds(circles)
    const width = box.maxX - box.minX
    const height = box.maxY - box.minY
    const scale = Math.min(1, (2 * FRAME) / width, (2 * FRAME) / height)
    const midX = (box.minX + box.maxX) / 2
    const midY = (box.minY + box.maxY) / 2
    const shiftX = (rand() - 0.5) * Math.max(0, 2 * FRAME - width * scale)
    const shiftY = (rand() - 0.5) * Math.max(0, 2 * FRAME - height * scale)

    return circles.map((c) => ({
        center: [(c.center[0] - midX) * scale + shiftX, (c.center[1] - midY) * scale + shiftY],
        radius: c.radius * scale,
    }))
}
