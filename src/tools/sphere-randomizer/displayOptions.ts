export type Shading = 'color' | 'grayscale' | 'none'

export interface DisplayOptions {
    shading: Shading
    lineWidth: number
    showFarSide: boolean
    showMarker: boolean
}

export const SHADINGS: readonly Shading[] = ['color', 'grayscale', 'none']
export const LINE_WIDTH_MIN = 1
export const LINE_WIDTH_MAX = 8

export const DEFAULT_OPTIONS: DisplayOptions = {
    shading: 'color',
    lineWidth: 2,
    showFarSide: true,
    showMarker: true,
}

/** Rounds to a whole pixel width within the allowed range. */
export function clampLineWidth(n: number): number {
    if (!Number.isFinite(n)) return DEFAULT_OPTIONS.lineWidth
    return Math.min(LINE_WIDTH_MAX, Math.max(LINE_WIDTH_MIN, Math.round(n)))
}

/**
 * Turns stored JSON into valid options. Anything missing, malformed, or out of
 * range falls back to the default for that field, so bad data can't break the app.
 */
export function parseOptions(raw: string | null): DisplayOptions {
    if (!raw) return { ...DEFAULT_OPTIONS }
    try {
        const data: unknown = JSON.parse(raw)
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            return { ...DEFAULT_OPTIONS }
        }
        const d = data as Record<string, unknown>
        return {
            shading: SHADINGS.find((s) => s === d.shading) ?? DEFAULT_OPTIONS.shading,
            lineWidth:
                typeof d.lineWidth === 'number'
                    ? clampLineWidth(d.lineWidth)
                    : DEFAULT_OPTIONS.lineWidth,
            showFarSide:
                typeof d.showFarSide === 'boolean' ? d.showFarSide : DEFAULT_OPTIONS.showFarSide,
            showMarker:
                typeof d.showMarker === 'boolean' ? d.showMarker : DEFAULT_OPTIONS.showMarker,
        }
    } catch {
        return { ...DEFAULT_OPTIONS }
    }
}

const STORAGE_KEY = 'sphere-studio:sphere-randomizer:display'

export function loadOptions(): DisplayOptions {
    try {
        return parseOptions(window.localStorage.getItem(STORAGE_KEY))
    } catch {
        return { ...DEFAULT_OPTIONS } // storage can be blocked, e.g. in some private modes
    }
}

export function saveOptions(options: DisplayOptions): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(options))
    } catch {
        // Storage unavailable or full: the options just won't persist.
    }
}
