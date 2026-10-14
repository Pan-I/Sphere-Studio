import {
    cameraAxes,
    horizonY,
    onePointCamera,
    threePointCamera,
    twoPointCamera,
    type Camera,
} from '../../math/perspective'
import type { Vec3 } from '../../math/quat'
import { mulberry32 } from '../../math/random'
import { MAX_SEED } from '../shared/seed'

export type PointCount = 1 | 2 | 3

/** Which grids Randomize and the timer pick: any, or only 1, 2 or 3 point ones. */
export type PointsChoice = 'any' | '1' | '2' | '3'

export interface GridPose {
    points: PointCount
    camera: Camera
    /** A box standing square to the grid, for the sample box: its center and half sizes. */
    box: { center: Vec3; half: Vec3 }
}

/**
 * The number of vanishing points comes from the seed itself, not the options, so a shared link
 * always shows the same grid whatever the person opening it has picked.
 */
export function pointsForSeed(seed: number): PointCount {
    return ((seed % 3) + 1) as PointCount
}

/** The nearest seed, at or just above `seed`, that gives the chosen number of points. */
export function fitSeed(seed: number, choice: PointsChoice): number {
    if (choice === 'any') return seed
    const fitted = seed - (seed % 3) + Number(choice) - 1
    return fitted > MAX_SEED ? fitted - 3 : fitted
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/**
 * The grid for a seed. The vanishing points are picked on the picture, the way you'd place them
 * on paper, and the camera that sees them is worked out from there. Every draw is taken in the
 * same order whatever the number of points, and new draws must only be added at the end, so
 * shared links keep their grid.
 */
export function poseFromSeed(seed: number): GridPose {
    const points = pointsForSeed(seed)
    const rand = mulberry32(seed)
    const [horizonT, spreadT, sideT, placeT, centerT, oneT, tiltT, thirdT] = [
        rand(),
        rand(),
        rand(),
        rand(),
        rand(),
        rand(),
        rand(),
        rand(),
    ]
    const boxT = [rand(), rand(), rand(), rand(), rand()]

    // The two points on the horizon: between 0.9 and 2 canvas widths apart, with one of them on
    // the canvas and the canvas's middle between them, so neither side is squeezed.
    const spread = 0.9 + 1.1 * spreadT
    const left = sideT < 0.5 ? 0.05 + 0.35 * placeT : 0.6 + 0.35 * placeT - spread
    const right = left + spread
    const centerX = clamp(0.35 + 0.3 * centerT, left + 0.15 * spread, right - 0.15 * spread)

    let camera: Camera
    if (points === 1) {
        camera = onePointCamera([0.25 + 0.5 * oneT, 0.25 + 0.5 * horizonT], 0.6)
    } else if (points === 2) {
        camera = twoPointCamera(left, right, 0.2 + 0.6 * horizonT, centerX)
    } else {
        // Looking up (a worm's-eye view) puts the horizon low and the third point above it;
        // looking down (a bird's-eye view) the other way round.
        const up = tiltT < 0.5
        const horizon = up ? 0.6 + 0.3 * horizonT : 0.1 + 0.3 * horizonT
        const gap = Math.sqrt((centerX - left) * (right - centerX)) * (1.5 + thirdT)
        camera = threePointCamera(left, right, horizon, [
            centerX,
            up ? horizon - gap : horizon + gap,
        ])
    }

    return { points, camera, box: sampleBox(camera, boxT) }
}

/**
 * A box about a fifth of the canvas across, at a depth of 1 so every corner stays well in front
 * of the eye. It sits clear of the horizon, below it when there's room, so you see its top (or
 * its underside) rather than looking straight along it.
 */
function sampleBox(camera: Camera, [xT, yT, ...sizeT]: number[]): GridPose['box'] {
    const { right, up, forward } = cameraAxes(camera)
    const horizon = horizonY(camera)
    const [lo, hi] = horizon <= 0.6 ? [horizon + 0.2, 0.8] : [0.2, horizon - 0.2]
    const x = (0.3 + 0.4 * xT - camera.center[0]) / camera.focal
    const y = -(lo + (hi - lo) * yT - camera.center[1]) / camera.focal
    const center = [0, 1, 2].map((i) => right[i] * x + up[i] * y + forward[i]) as unknown as Vec3
    const scale = Math.min(0.1 / camera.focal, 0.22)
    const half = sizeT.map((t) => scale * (0.6 + 0.6 * t)) as unknown as Vec3
    return { center, half }
}
