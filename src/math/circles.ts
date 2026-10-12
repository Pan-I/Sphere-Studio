// src/math/circles.ts

/** A point or direction on the flat canvas, as [x, y]. */
export type Vec2 = readonly [number, number]

export interface Circle {
    center: Vec2
    radius: number
}

/** The smallest axis-aligned box that contains every circle. */
export interface Bounds {
    minX: number
    minY: number
    maxX: number
    maxY: number
}

/** Straight-line distance between two points. */
export function distance(a: Vec2, b: Vec2): number {
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    return Math.hypot(dx, dy)
}

/** True when the two circles share some area. Touching at a single point doesn't count. */
export function overlaps(a: Circle, b: Circle): boolean {
    const dx = b.center[0] - a.center[0]
    const dy = b.center[1] - a.center[1]
    return Math.hypot(dx, dy) < a.radius + b.radius
}

/** The point a fraction t of the way from a to b: t = 0 gives a, t = 1 gives b. */
export function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

/** The box around all the circles. Needs at least one circle. */
export function bounds(circles: readonly Circle[]): Bounds {
    const xs = circles.map((c) => c.center[0] - c.radius)
    const ys = circles.map((c) => c.center[1] - c.radius)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...circles.map((c) => c.center[0] + c.radius))
    const maxY = Math.max(...circles.map((c) => c.center[1] + c.radius))
    return { minX, minY, maxX, maxY }
}
