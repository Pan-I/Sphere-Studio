/** How many poses Back can return to. Older ones drop off the start. */
export const HISTORY_LIMIT = 20

/** The poses shown this session, oldest first, and which one is on screen. */
export interface PoseHistory {
    seeds: readonly number[]
    index: number
}

export function startHistory(seed: number): PoseHistory {
    return { seeds: [seed], index: 0 }
}

export const currentSeed = (history: PoseHistory): number => history.seeds[history.index]
export const canGoBack = (history: PoseHistory): boolean => history.index > 0
export const canGoForward = (history: PoseHistory): boolean =>
    history.index < history.seeds.length - 1

/**
 * Adds a newly shown pose after the current one. Like a browser, anything you'd gone back past
 * is dropped. Showing the pose that's already on screen changes nothing.
 */
export function pushPose(history: PoseHistory, seed: number, limit = HISTORY_LIMIT): PoseHistory {
    if (seed === currentSeed(history)) return history
    const seeds = [...history.seeds.slice(0, history.index + 1), seed].slice(-limit)
    return { seeds, index: seeds.length - 1 }
}

/** Moves one pose back (-1) or forward (+1). Stays put at either end. */
export function stepHistory(history: PoseHistory, step: -1 | 1): PoseHistory {
    const index = Math.min(Math.max(history.index + step, 0), history.seeds.length - 1)
    return index === history.index ? history : { ...history, index }
}
