// src/math/ellipse.ts
import type { Vec3 } from './quat'

type Vec2 = readonly [number, number]

/** An ellipse on screen: its centre, and half of each axis as a vector from the centre. */
export interface ScreenEllipse {
    centre: Vec2
    /** Half the major (long) axis. */
    major: Vec2
    /** Half the minor (short) axis, at right angles to `major`. */
    minor: Vec2
}

/**
 * The ellipse a circle becomes on screen, with its true centre and axes. The circle is the
 * points `centre + cos φ·a + sin φ·b`, where `a` and `b` are at right angles and as long as the
 * radius. Screen coordinates are the ones `project` in cube.ts gives: x and y in a flat view, or
 * x and y scaled by camera / (camera − z) in perspective.
 *
 * In a flat view the major axis is the diameter lying across the line of sight and the minor
 * axis lines up with the circle's normal. In perspective the far half shrinks, so the ellipse's
 * centre moves away from the circle's projected centre and its axes turn a little.
 *
 * The projection takes (cos φ, sin φ, 1) to screen coordinates in homogeneous form with one
 * 3×3 matrix M, so the unit circle x² + y² − 1 = 0 becomes the conic adj(M)ᵀ·diag(1, 1, −1)·adj(M)
 * on screen. The centre, axis directions and axis lengths come straight from that conic.
 * Returns null when the circle is seen exactly edge-on, as a line.
 */
export function projectedCircle(
    centre: Vec3,
    a: Vec3,
    b: Vec3,
    camera: number | null,
): ScreenEllipse | null {
    // Columns of M: where a, b and the centre go, in homogeneous screen coordinates.
    const col = (p: Vec3, point: 0 | 1): Vec3 =>
        camera === null
            ? [p[0], p[1], point]
            : [camera * p[0], camera * p[1], point * camera - p[2]]
    const m = [col(a, 0), col(b, 0), col(centre, 1)]
    // adj(M) = det(M)·M⁻¹. Its rows are cross products of M's columns.
    const cross = (p: Vec3, q: Vec3): Vec3 => [
        p[1] * q[2] - p[2] * q[1],
        p[2] * q[0] - p[0] * q[2],
        p[0] * q[1] - p[1] * q[0],
    ]
    const adj = [cross(m[1], m[2]), cross(m[2], m[0]), cross(m[0], m[1])]
    const det = adj[0][0] * m[0][0] + adj[0][1] * m[0][1] + adj[0][2] * m[0][2]
    if (Math.abs(det) < 1e-12) return null

    // The conic C = adj(M)ᵀ·diag(1, 1, −1)·adj(M), as C[i][j].
    const c = (i: number, j: number) =>
        adj[0][i] * adj[0][j] + adj[1][i] * adj[1][j] - adj[2][i] * adj[2][j]
    const p = c(0, 0)
    const q = c(0, 1)
    const s = c(1, 1)
    const gx = c(0, 2)
    const gy = c(1, 2)

    // S's determinant and the conic's value k at the centre, from M directly: subtracting the
    // conic's entries would lose most of the precision on a thin ellipse. With w the bottom row
    // of M, det S = det(M)²·(w₂² − w₀² − w₁²) and k = det C / det S = −det(M)⁴ / det S.
    const w = [m[0][2], m[1][2], m[2][2]]
    const detS = det * det * (w[2] * w[2] - w[0] * w[0] - w[1] * w[1])
    const k = -(det ** 4) / detS

    // Centre: where the conic's gradient is zero, S·x = −g. The ellipse is
    // (x − x0)ᵀ·S·(x − x0) = −k.
    const x0 = (q * gy - s * gx) / detS
    const y0 = (q * gx - p * gy) / detS

    // S's eigenvalues. The larger one belongs to the short axis, at angle θ.
    const mean = (p + s) / 2
    const spread = Math.hypot((p - s) / 2, q)
    const big = Math.abs(mean) + spread
    const small = detS / big
    const sign = Math.sign(mean)
    const theta = 0.5 * Math.atan2(sign * 2 * q, sign * (p - s))
    const minorLen = Math.sqrt(Math.abs(k) / big)
    const majorLen = Math.sqrt(Math.abs(k) / small)
    const cos = Math.cos(theta)
    const sin = Math.sin(theta)
    return {
        centre: [x0, y0],
        major: [-sin * majorLen, cos * majorLen],
        minor: [cos * minorLen, sin * minorLen],
    }
}
