import { describe, expect, it } from 'vitest'
import { carvedFinder, carvedPieces, insideCarved, type Carved } from './carve'
import type { Vec3 } from './quat'
import type { Solid, Span } from './solids'

const sphere = (centre: Vec3, scale: number): Solid => ({
    kind: 'sphere',
    centre,
    scale,
    q: [0, 0, 0, 1],
    proportion: 1,
})

const span = (t0: number, t1: number, face = 0, exit = 0): Span => ({ t0, t1, face, exit })

describe('carvedPieces', () => {
    it('leaves a ray alone where no cut crosses it', () => {
        expect(carvedPieces(span(1, 3, 2), [null, span(5, 6)])).toEqual([
            { t0: 1, t1: 3, cut: -1, face: 2 },
        ])
    })

    it('starts the ray in the hollow where a cut takes the front off', () => {
        expect(carvedPieces(span(1, 3), [span(0, 2, 0, 1)])).toEqual([
            { t0: 2, t1: 3, cut: 0, face: 1 },
        ])
    })

    it('splits the ray where a cut runs through the middle', () => {
        expect(carvedPieces(span(1, 5), [span(2, 3)])).toEqual([
            { t0: 1, t1: 2, cut: -1, face: 0 },
            { t0: 3, t1: 5, cut: 0, face: 0 },
        ])
    })

    it('leaves nothing where a cut goes right through', () => {
        expect(carvedPieces(span(1, 3), [span(0, 4)])).toEqual([])
        expect(carvedPieces(null, [span(0, 4)])).toEqual([])
    })

    it('takes each cut out in turn', () => {
        expect(carvedPieces(span(0, 10), [span(-1, 2), span(1, 4), span(8, 12)])).toEqual([
            { t0: 4, t1: 8, cut: 1, face: 0 },
        ])
    })
})

describe('a sphere with a sphere cut out of its front', () => {
    const carved: Carved = { main: sphere([0, 0, 0], 1), cuts: [sphere([0, 0, 1], 0.5)] }

    it('knows what is left', () => {
        expect(insideCarved(carved, [0, 0, 0])).toBeLessThan(0)
        expect(insideCarved(carved, [0, 0, 0.9])).toBeGreaterThan(0) // in the hollow
        expect(insideCarved(carved, [0, 0, 0.5])).toBeCloseTo(0, 10) // on the hollow's floor
        expect(insideCarved(carved, [0, 0, 2])).toBeGreaterThan(0)
    })

    it('sees the floor of the hollow straight on, and the outside off to one side', () => {
        const pieces = carvedFinder(carved)
        const [first] = pieces([0, 0, 5], [0, 0, -1])
        expect(first.cut).toBe(0)
        expect(5 - first.t0).toBeCloseTo(0.5, 10)
        expect(pieces([0, 0.8, 5], [0, 0, -1])[0].cut).toBe(-1)
        expect(pieces([0, 2, 5], [0, 0, -1])).toEqual([])
    })
})
