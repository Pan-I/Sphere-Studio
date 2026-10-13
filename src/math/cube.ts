// src/math/cube.ts
import { dot, type Vec3 } from './quat'

/** Half the edge length of a cube whose corners sit on the unit sphere. */
export const HALF_EDGE = 1 / Math.sqrt(3)

/**
 * The 8 corners of a cube centred on the origin, with every corner on the unit sphere.
 * Corner i has bit 0 of i set for +x, bit 1 for +y and bit 2 for +z.
 */
export const CORNERS: readonly Vec3[] = Array.from({ length: 8 }, (_, i): Vec3 => [
    i & 1 ? HALF_EDGE : -HALF_EDGE,
    i & 2 ? HALF_EDGE : -HALF_EDGE,
    i & 4 ? HALF_EDGE : -HALF_EDGE,
])

/**
 * The 12 edges, as pairs of corner indices. Two corners share an edge when they differ
 * in exactly one coordinate, which is one bit of their index.
 */
export const EDGES: readonly (readonly [number, number])[] = CORNERS.flatMap((_, a) =>
    [1, 2, 4].filter((bit) => !(a & bit)).map((bit) => [a, a | bit] as const),
)

export interface Face {
    /** 0 for the x faces, 1 for y, 2 for z. Opposite faces share an axis. */
    axis: number
    /** Unit vector pointing out of the cube. */
    normal: Vec3
    /** The face's corners in order around it, so consecutive corners share an edge. */
    corners: readonly [number, number, number, number]
}

/** The 6 faces: −x, +x, −y, +y, −z, +z. */
export const FACES: readonly Face[] = [0, 1, 2].flatMap((axis) =>
    [0, 1].map((side): Face => {
        const bit = 1 << axis
        // The other two axes' bits, walked in the order 00, 01, 11, 10 to go around the face.
        const [u, v] = [1, 2, 4].filter((b) => b !== bit)
        const base = side ? bit : 0
        const sign = side ? 1 : -1
        const normal: Vec3 = [axis === 0 ? sign : 0, axis === 1 ? sign : 0, axis === 2 ? sign : 0]
        return { axis, normal, corners: [base, base | u, base | u | v, base | v] }
    }),
)

/**
 * The points a cube corner lands on screen, in units where the cube's corners sit on the unit
 * sphere. `camera` is the distance from the cube's centre to the eye, in those units, for a
 * perspective view; null gives a flat (orthographic) view. Points at depth 0 keep their size
 * either way, so switching between the two only changes how much near and far parts differ.
 */
export function project(p: Vec3, camera: number | null): readonly [number, number] {
    if (camera === null) return [p[0], p[1]]
    const scale = camera / (camera - p[2])
    return [p[0] * scale, p[1] * scale]
}

/**
 * Whether a face of the rotated cube points toward the viewer. `normal` and `pointOnFace` are
 * already rotated. In a flat view the viewer looks along −z, so only the normal's z matters; in
 * perspective the eye sits at (0, 0, camera) and sees a face when the face points toward it.
 */
export function facesViewer(normal: Vec3, pointOnFace: Vec3, camera: number | null): boolean {
    if (camera === null) return normal[2] > 0
    const toEye: Vec3 = [-pointOnFace[0], -pointOnFace[1], camera - pointOnFace[2]]
    return dot(normal, toEye) > 0
}
