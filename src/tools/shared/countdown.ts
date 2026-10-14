export const MIN_SECONDS = 1
export const MAX_SECONDS = 3600

export interface Countdown {
    remaining: number // whole seconds left on the current pose
    fired: boolean // true on the tick where a new pose is due
}

/** Whole seconds from MIN to MAX, or null if the text isn't valid. */
export function parseInterval(text: string): number | null {
    const trimmed = text.trim()
    if (!/^\d+$/.test(trimmed)) return null
    const n = Number(trimmed)
    return n >= MIN_SECONDS && n <= MAX_SECONDS ? n : null
}

/** Advance the countdown by one second. When time runs out, fire and reset. */
export function tick(c: Countdown, interval: number): Countdown {
    return c.remaining <= 1
        ? { remaining: interval, fired: true }
        : { remaining: c.remaining - 1, fired: false }
}

/**
 * How full to draw the countdown ring, from 1 (the whole interval left) down to 0. While running
 * it aims at where the time will be on the next tick, and the ring's CSS transition fills in the
 * second between, so it drains smoothly instead of in steps. Before the first Start it's full,
 * and with no valid interval it's empty.
 */
export function ringFraction(
    countdown: Countdown | null,
    interval: number | null,
    running: boolean,
): number {
    if (interval === null) return 0
    if (!countdown) return 1
    const remaining = running ? countdown.remaining - 1 : countdown.remaining
    return Math.min(1, Math.max(0, remaining / interval))
}
