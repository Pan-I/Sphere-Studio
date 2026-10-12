export type Fill = 'color' | 'grayscale' | 'none'

export interface CircleOptions {
    fill: Fill
    opacity: number // percent, how solid each translucent fill is
    lineWidth: number
    showOutlines: boolean
    showCenters: boolean
}

export const FILLS: readonly Fill[] = ['color', 'grayscale', 'none']
export const OPACITY_MIN = 15
export const OPACITY_MAX = 60
export const LINE_WIDTH_MIN = 1
export const LINE_WIDTH_MAX = 8

export const DEFAULT_OPTIONS: CircleOptions = {
    fill: 'color',
    opacity: 35,
    lineWidth: 2,
    showOutlines: true,
    showCenters: false,
}

/** Rounds to a whole number within min..max, or returns the fallback for NaN and Infinity. */
function clampWhole(n: number, min: number, max: number, fallback: number): number {
    if (!Number.isFinite(n)) return fallback
    return Math.min(max, Math.max(min, Math.round(n)))
}

export const clampOpacity = (n: number) =>
    clampWhole(n, OPACITY_MIN, OPACITY_MAX, DEFAULT_OPTIONS.opacity)

export const clampLineWidth = (n: number) =>
    clampWhole(n, LINE_WIDTH_MIN, LINE_WIDTH_MAX, DEFAULT_OPTIONS.lineWidth)

/** With no fill, the outlines are all there is, so they're always drawn. */
export const outlinesShown = (options: CircleOptions) =>
    options.showOutlines || options.fill === 'none'

/**
 * Turns stored JSON into valid options. Anything missing, malformed, or out of
 * range falls back to the default for that field, so bad data can't break the tool.
 */
export function parseOptions(raw: string | null): CircleOptions {
    if (!raw) return { ...DEFAULT_OPTIONS }
    try {
        const data: unknown = JSON.parse(raw)
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            return { ...DEFAULT_OPTIONS }
        }
        const d = data as Record<string, unknown>
        return {
            fill: FILLS.find((f) => f === d.fill) ?? DEFAULT_OPTIONS.fill,
            opacity:
                typeof d.opacity === 'number' ? clampOpacity(d.opacity) : DEFAULT_OPTIONS.opacity,
            lineWidth:
                typeof d.lineWidth === 'number'
                    ? clampLineWidth(d.lineWidth)
                    : DEFAULT_OPTIONS.lineWidth,
            showOutlines:
                typeof d.showOutlines === 'boolean' ? d.showOutlines : DEFAULT_OPTIONS.showOutlines,
            showCenters:
                typeof d.showCenters === 'boolean' ? d.showCenters : DEFAULT_OPTIONS.showCenters,
        }
    } catch {
        return { ...DEFAULT_OPTIONS }
    }
}

const STORAGE_KEY = 'sphere-studio:circle-trio:display'

export function loadOptions(): CircleOptions {
    try {
        return parseOptions(window.localStorage.getItem(STORAGE_KEY))
    } catch {
        return { ...DEFAULT_OPTIONS } // storage can be blocked, e.g. in some private modes
    }
}

export function saveOptions(options: CircleOptions): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(options))
    } catch {
        // Storage unavailable or full: the options just won't persist.
    }
}
