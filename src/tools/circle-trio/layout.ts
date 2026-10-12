import { bounds, lerp, type Circle, type Vec2 } from '../../math/circles'
import { mulberry32, type Rng } from '../../math/random'

/** Every circle stays inside this distance from the canvas centre (the canvas spans −1 to 1). */
export const FRAME = 0.9

/** A random number between min and max, using one draw from the stream. */
const between = (rand: Rng, min: number, max: number) => min + (max - min) * rand()

/**
 * Two large circles (A bigger than B, most of the time) and a small one roughly between them.
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

    // 6–9: the small circle. Start part way along the line from A to B...
    const onLine = lerp(centerA, centerB, between(rand, 0.3, 0.7))
    // ...then push it sideways: usually a little, sometimes (35%) noticeably.
    const drifts = rand() < 0.35
    const amount = drifts ? between(rand, 0.6, 1.4) : between(rand, 0, 0.6)
    const side = rand() < 0.5 ? -1 : 1
    const push = side * amount * radiusS
    const centerS: Vec2 = [onLine[0] + sideways[0] * push, onLine[1] + sideways[1] * push]

    const circles: [Circle, Circle, Circle] = [
        { center: centerA, radius: radiusA },
        { center: centerB, radius: radiusB },
        { center: centerS, radius: radiusS },
    ]

    // 10–11: centre the group on the canvas, then shift it randomly within the room left over.
    const box = bounds(circles)
    const roomX = Math.max(0, 2 * FRAME - (box.maxX - box.minX))
    const roomY = Math.max(0, 2 * FRAME - (box.maxY - box.minY))
    const shiftX = -(box.minX + box.maxX) / 2 + (rand() - 0.5) * roomX
    const shiftY = -(box.minY + box.maxY) / 2 + (rand() - 0.5) * roomY

    const move = (c: Circle): Circle => ({
        center: [c.center[0] + shiftX, c.center[1] + shiftY],
        radius: c.radius,
    })
    return [move(circles[0]), move(circles[1]), move(circles[2])]
}
