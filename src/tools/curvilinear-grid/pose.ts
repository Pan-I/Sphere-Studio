import { unprojectPoint, type CurvedCamera, type Lens } from '../../math/curvilinear'
import type { Vec3 } from '../../math/quat'
import { mulberry32 } from '../../math/random'
import { MAX_SEED } from '../shared/seed'

/** Which grids Randomize and the timer pick: any, or only fish-eye or panoramic ones. */
export type LensChoice = 'any' | Lens

export interface CurvedGridPose {
    camera: CurvedCamera
    /** A box standing square to the grid, for the sample box: its center and half sizes. */
    box: { center: Vec3; half: Vec3 }
}

/**
 * The lens comes from the seed itself, not the options, so a shared link always shows the same
 * grid whatever the person opening it has picked: even seeds are fish-eye, odd ones panoramic.
 */
export function lensForSeed(seed: number): Lens {
    return seed % 2 === 0 ? 'fisheye' : 'panoramic'
}

/** The nearest seed, at or just above `seed`, that gives the chosen lens. */
export function fitSeed(seed: number, choice: LensChoice): number {
    if (choice === 'any' || lensForSeed(seed) === choice) return seed
    return seed + 1 > MAX_SEED ? seed - 1 : seed + 1
}

const DEG = Math.PI / 180

/** How close to level the sample box may sit, so you see its top or underside, not along it. */
const BOX_CLEAR = 10 * DEG

/**
 * The grid for a seed. The camera is picked first and the vanishing points land where they land:
 * a fish-eye always shows one end of every direction's lines, and a panorama two of the four
 * points on its horizon, so there's no need to place them by hand. Every draw is taken in the
 * same order whatever the lens, and new draws must only be added at the end, so shared links
 * keep their grid.
 */
export function poseFromSeed(seed: number): CurvedGridPose {
    const lens = lensForSeed(seed)
    const rand = mulberry32(seed)
    const [turnT, squareT, levelT, tiltT, horizonT] = [rand(), rand(), rand(), rand(), rand()]
    const boxT = [rand(), rand(), rand(), rand(), rand()]

    // Turned up to 45° either way (the grid repeats every 90°), sometimes looking square along
    // z, which gives the symmetric 5 point fish-eye or a panorama with a point in the middle.
    const yaw = squareT < 0.25 ? 0 : (turnT * 2 - 1) * 45 * DEG

    let camera: CurvedCamera
    if (lens === 'fisheye') {
        // Level about a third of the time; otherwise looking 20° to 60° up (a worm's eye) or
        // down (a bird's eye), which brings the verticals' point into the circle.
        const up = tiltT < 0.5
        const tilt = (20 + 40 * ((tiltT * 2) % 1)) * DEG
        const pitch = levelT < 0.35 ? 0 : up ? tilt : -tilt
        camera = { lens, yaw, pitch, center: [0.5, 0.5] }
    } else {
        // Level, or the verticals would bend; looking up or down moves the horizon instead.
        camera = { lens, yaw, pitch: 0, center: [0.5, 0.3 + 0.4 * horizonT] }
    }

    return { camera, box: sampleBox(camera, boxT) }
}

/**
 * A box at a distance of 1, near the middle of the picture and clear of the horizon. Its size is
 * a good part of its distance, so its edges bow enough to see: the closer a box, the more a
 * curvilinear picture bends it. On a panorama, heights stretch fast away from the horizon, so
 * the box is a little smaller and sits on the side of the horizon with more room.
 */
function sampleBox(camera: CurvedCamera, [xT, yT, ...sizeT]: number[]): CurvedGridPose['box'] {
    // Between the middle and the horizon: on a panorama, on the side with more room; on a
    // fish-eye looking up or down, away from the verticals' point; either side of a level one.
    const [, middle] = camera.center
    let y: number
    if (camera.lens === 'panoramic') {
        y = middle + (middle <= 0.5 ? 1 : -1) * (0.08 + 0.1 * yT)
    } else if (camera.pitch === 0) {
        y = middle + (yT * 2 - 1) * 0.2
    } else {
        y = middle + Math.sign(camera.pitch) * (0.04 + 0.16 * yT)
    }
    const [lo, span] = camera.lens === 'fisheye' ? [0.16, 0.14] : [0.12, 0.1]
    const half = sizeT.map((t) => lo + span * t) as unknown as Vec3

    const d = unprojectPoint(camera, [0.32 + 0.36 * xT, y])
    // Keep the whole box at least BOX_CLEAR above or below eye level (below when its middle is
    // on the horizon), so you see its top or underside rather than looking along it.
    const level = Math.hypot(d[0], d[2])
    const rise = Math.atan2(d[1], level)
    const clear = BOX_CLEAR + Math.atan(half[1])
    const lift = Math.abs(rise) >= clear ? rise : rise > 0 ? clear : -clear
    const center: Vec3 = [
        (d[0] / level) * Math.cos(lift),
        Math.sin(lift),
        (d[2] / level) * Math.cos(lift),
    ]
    return { center, half }
}
