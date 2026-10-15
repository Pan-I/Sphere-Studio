// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_SEED } from '../tools/shared/seed'
import {
    PRINT_DPI,
    ROOM_PADDING_MM,
    SHEET_HEIGHT_MM,
    SHEET_WIDTH_MM,
    WORKSHEET_KEY,
    loadChoices,
    readSettings,
    saveChoices,
    settingsSearch,
    sheetSeeds,
    worksheetLayout,
    type WorksheetSettings,
} from './worksheet'

const TOOLS = ['sphere-randomizer', 'box-randomizer']
const FALLBACK: WorksheetSettings = { tool: 'sphere-randomizer', seed: 7, poses: 6, room: true }

describe('worksheetLayout', () => {
    it.each([
        [6, false, 2, 3],
        [12, false, 3, 4],
        [6, true, 2, 3],
        [12, true, 2, 6],
    ] as const)('puts %i poses (room %s) in %i columns of %i', (poses, room, columns, rows) => {
        const layout = worksheetLayout(poses, room)
        expect([layout.columns, layout.rows]).toEqual([columns, rows])
        expect(layout.columns * layout.rows).toBe(poses)
    })

    it.each([
        [6, false],
        [12, false],
        [6, true],
        [12, true],
    ] as const)('fits %i poses (room %s) on the sheet', (poses, room) => {
        const { columns, rows, poseMm } = worksheetLayout(poses, room)
        const pad = room ? 2 * ROOM_PADDING_MM : 0
        // Pose, caption and padding per row, with a 6 mm gap, under the 10 mm header.
        expect(10 + rows * (6 + poseMm + 5 + pad)).toBeLessThanOrEqual(SHEET_HEIGHT_MM)
        expect(columns * (poseMm + pad) + (columns - 1) * 6).toBeLessThanOrEqual(SHEET_WIDTH_MM)
        expect(poseMm).toBeGreaterThanOrEqual(20)
    })

    it('leaves more than half of each box for drawing when there is room', () => {
        for (const poses of [6, 12] as const) {
            const { poseMm } = worksheetLayout(poses, true)
            const boxWidth = (SHEET_WIDTH_MM - 6) / 2
            expect(poseMm).toBeLessThan(boxWidth / 2)
        }
    })

    it('draws each pose at print resolution', () => {
        const { poseMm, pixels } = worksheetLayout(6, false)
        expect(pixels).toBe(Math.round((poseMm / 25.4) * PRINT_DPI))
    })
})

describe('sheetSeeds', () => {
    it('counts on from the first seed', () => {
        expect(sheetSeeds(48213, 6)).toEqual([48213, 48214, 48215, 48216, 48217, 48218])
    })

    it('wraps past the last seed back to 0', () => {
        expect(sheetSeeds(MAX_SEED - 1, 4)).toEqual([MAX_SEED - 1, MAX_SEED, 0, 1])
    })
})

describe('the address bar', () => {
    it('reads a sheet back from its own link', () => {
        const sheet: WorksheetSettings = {
            tool: 'box-randomizer',
            seed: 48213,
            poses: 12,
            room: false,
        }
        expect(settingsSearch(sheet)).toBe('?tool=box-randomizer&seed=48213&poses=12&room=0')
        expect(readSettings(settingsSearch(sheet), TOOLS, FALLBACK)).toEqual(sheet)
    })

    it('falls back for anything missing or not understood', () => {
        expect(readSettings('', TOOLS, FALLBACK)).toEqual(FALLBACK)
        expect(readSettings('?tool=value-study&seed=-3&poses=8&room=yes', TOOLS, FALLBACK)).toEqual(
            FALLBACK,
        )
        expect(readSettings('?seed=12', TOOLS, FALLBACK)).toEqual({ ...FALLBACK, seed: 12 })
    })
})

describe('remembering choices', () => {
    beforeEach(() => window.localStorage.clear())

    it('starts with the first tool, 6 poses and room to draw', () => {
        expect(loadChoices(TOOLS)).toEqual({ tool: 'sphere-randomizer', poses: 6, room: true })
    })

    it('keeps the tool, pose count and room, but not the seed', () => {
        saveChoices({ tool: 'box-randomizer', seed: 99, poses: 12, room: false })
        expect(JSON.parse(window.localStorage.getItem(WORKSHEET_KEY)!)).toEqual({
            tool: 'box-randomizer',
            poses: 12,
            room: false,
        })
        expect(loadChoices(TOOLS)).toEqual({ tool: 'box-randomizer', poses: 12, room: false })
    })

    it('ignores saved values it does not understand', () => {
        window.localStorage.setItem(WORKSHEET_KEY, '{"tool":"gone","poses":7,"room":1}')
        expect(loadChoices(TOOLS)).toEqual({ tool: 'sphere-randomizer', poses: 6, room: true })
        window.localStorage.setItem(WORKSHEET_KEY, 'not json')
        expect(loadChoices(TOOLS)).toEqual({ tool: 'sphere-randomizer', poses: 6, room: true })
    })
})
