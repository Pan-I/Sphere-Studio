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
