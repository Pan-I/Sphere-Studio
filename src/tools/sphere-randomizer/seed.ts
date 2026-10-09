import { randomQuat, type Quat } from '../../math/quat'
import { mulberry32, type Rng } from '../../math/random'

/** Seeds are 0 to 999,999: plenty of distinct poses, and short enough to type or read aloud. */
export const MAX_SEED = 999_999

/** A whole number from 0 to MAX_SEED, or null if the text isn't valid. */
export function parseSeed(text: string): number | null {
    const trimmed = text.trim()
    if (!/^\d+$/.test(trimmed)) return null
    const n = Number(trimmed)
    return n <= MAX_SEED ? n : null
}

export function randomSeed(rand: Rng = Math.random): number {
    return Math.floor(rand() * (MAX_SEED + 1))
}

/**
 * Orientation plus a marker pick for a seed. The orientation uses the first three
 * draws of the seed's stream, exactly as before, so existing links keep their pose.
 * The marker pick is the fourth draw, a number in [0, 1).
 */
export function poseFromSeed(seed: number): { q: Quat; markerPick: number } {
    const rand = mulberry32(seed)
    const q = randomQuat(rand)
    return { q, markerPick: rand() }
}

/** The same seed always produces the same orientation. */
export function quatFromSeed(seed: number): Quat {
    return poseFromSeed(seed).q
}

/** Reads ?seed=… from a location.search string. Null if absent or invalid. */
export function readSeedFromUrl(search: string): number | null {
    const value = new URLSearchParams(search).get('seed')
    return value === null ? null : parseSeed(value)
}

/** Returns the given URL with its seed parameter set, keeping other params and the hash. */
export function buildShareUrl(href: string, seed: number): string {
    const url = new URL(href)
    url.searchParams.set('seed', String(seed))
    return url.toString()
}