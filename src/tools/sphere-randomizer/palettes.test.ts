import { describe, expect, it } from 'vitest'
import { SECTOR_COLORS, SECTOR_GRAYS, paletteFor } from './palettes'

// Sectors on either side of a single line differ by exactly one bit of their index.
const touching = (i: number) => [0, 1, 2].map((bit) => i ^ (1 << bit))

describe('palettes', () => {
    it('each palette has eight distinct entries', () => {
        for (const palette of [SECTOR_COLORS, SECTOR_GRAYS]) {
            expect(palette).toHaveLength(8)
            expect(new Set(palette.map((c) => c.join(','))).size).toBe(8)
        }
    })

    it('touching sectors never share a color', () => {
        for (let i = 0; i < 8; i++) {
            for (const n of touching(i)) {
                expect(SECTOR_COLORS[i]).not.toEqual(SECTOR_COLORS[n])
            }
        }
    })

    it('touching sectors differ by at least 40 gray levels', () => {
        for (let i = 0; i < 8; i++) {
            for (const n of touching(i)) {
                expect(Math.abs(SECTOR_GRAYS[i][0] - SECTOR_GRAYS[n][0])).toBeGreaterThanOrEqual(40)
            }
        }
    })

    it('grays are neutral (equal red, green, and blue)', () => {
        for (const [r, g, b] of SECTOR_GRAYS) {
            expect(g).toBe(r)
            expect(b).toBe(r)
        }
    })

    it('maps each shading mode to its palette, with none meaning no fill', () => {
        expect(paletteFor('color')).toBe(SECTOR_COLORS)
        expect(paletteFor('grayscale')).toBe(SECTOR_GRAYS)
        expect(paletteFor('none')).toBeNull()
    })
})
