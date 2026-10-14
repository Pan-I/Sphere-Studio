import { parseSeed } from './seed'

/** How many favorites a tool keeps. Starring one more drops the oldest. */
export const FAVORITES_LIMIT = 50

/** The localStorage key for a tool's favorites. Keep it unchanged so people's stars survive. */
export const favoritesKey = (slug: string) => `sphere-studio:${slug}:favorites`

/**
 * Turns stored JSON into a list of seeds, newest first. Anything that isn't a valid seed is
 * dropped, as are repeats, so bad data can't break the tool.
 */
export function parseFavorites(raw: string | null, limit = FAVORITES_LIMIT): number[] {
    if (!raw) return []
    try {
        const data: unknown = JSON.parse(raw)
        if (!Array.isArray(data)) return []
        const seeds = data
            .map((value) => (typeof value === 'number' ? parseSeed(String(value)) : null))
            .filter((seed): seed is number => seed !== null)
        return [...new Set(seeds)].slice(0, limit)
    } catch {
        return []
    }
}

/** Stars a seed (it goes first) or, if it's already starred, unstars it. */
export function toggleFavorite(
    favorites: readonly number[],
    seed: number,
    limit = FAVORITES_LIMIT,
): number[] {
    if (favorites.includes(seed)) return favorites.filter((s) => s !== seed)
    return [seed, ...favorites].slice(0, limit)
}

/** Reads a tool's favorites from the browser. Empty if there are none or storage is blocked. */
export function loadFavorites(slug: string): number[] {
    try {
        return parseFavorites(window.localStorage.getItem(favoritesKey(slug)))
    } catch {
        return []
    }
}

export function saveFavorites(slug: string, favorites: readonly number[]) {
    try {
        if (favorites.length === 0) window.localStorage.removeItem(favoritesKey(slug))
        else window.localStorage.setItem(favoritesKey(slug), JSON.stringify(favorites))
    } catch {
        // Storage unavailable or full: the favorites just won't persist.
    }
}
