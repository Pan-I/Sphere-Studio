import type { Shading } from './displayOptions'

export type RGB = readonly [number, number, number]

const gray = (v: number): RGB => [v, v, v]

// Sectors that touch across a line differ by exactly one bit of their index, so
// their bit-parity always alternates. Each palette puts light shades on even
// parity (0, 3, 5, 6) and strong contrast on odd parity (1, 2, 4, 7).

export const SECTOR_COLORS: readonly RGB[] = [
    [255, 214, 165], // 0 (even) orange
    [189, 224, 254], // 1 (odd)  blue
    [202, 255, 191], // 2 (odd)  green
    [255, 241, 168], // 3 (even) yellow
    [214, 200, 255], // 4 (odd)  lavender
    [255, 198, 220], // 5 (even) pink
    [255, 179, 167], // 6 (even) coral
    [160, 235, 230], // 7 (odd)  teal
]

export const SECTOR_GRAYS: readonly RGB[] = [
    gray(240), // 0 (even) light
    gray(150), // 1 (odd)  dark
    gray(120), // 2 (odd)  dark
    gray(215), // 3 (even) light
    gray(170), // 4 (odd)  dark
    gray(228), // 5 (even) light
    gray(250), // 6 (even) light
    gray(135), // 7 (odd)  dark
]

/** The fill palette for a shading mode, or null when no fill is wanted. */
export function paletteFor(shading: Shading): readonly RGB[] | null {
    switch (shading) {
        case 'color':
            return SECTOR_COLORS
        case 'grayscale':
            return SECTOR_GRAYS
        case 'none':
            return null
    }
}
