/**
 * The drawing buffer is capped at 2x the displayed size. Shading runs per pixel, and a
 * 3x phone screen would need 2.25 times as many pixels as 2x for almost no visible gain.
 */
export const MAX_BUFFER_SCALE = 2

/** How many buffer pixels to use per displayed pixel, given the screen's pixel ratio. */
export function bufferScale(devicePixelRatio: number): number {
    if (!Number.isFinite(devicePixelRatio) || devicePixelRatio < 1) return 1
    return Math.min(devicePixelRatio, MAX_BUFFER_SCALE)
}