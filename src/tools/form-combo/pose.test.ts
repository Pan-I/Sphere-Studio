import { describe, expect, it } from 'vitest'
import { meetLine, shareInside } from '../../math/meet'
import { comboFromSeed, describeForms, sharesSeen, type FormsChoice } from './pose'

const SEEDS = [1, 77, 4242, 48213, 99999, 123456, 777777]

describe.each<[FormsChoice, number]>([
    ['two', 2],
    ['three', 3],
    ['four', 4],
])('comboFromSeed with %s forms', (forms, count) => {
    const combos = SEEDS.map((seed) => comboFromSeed(seed, forms))

    it('places the right forms', () => {
        for (const { solids } of combos) {
            expect(solids).toHaveLength(count)
            const kinds = new Set(solids.map((s) => s.kind))
            expect(kinds.size).toBe(count)
            if (forms === 'three') expect(kinds).toEqual(new Set(['sphere', 'box', 'cylinder']))
            if (forms === 'four') expect(kinds.has('cone')).toBe(true)
            if (forms === 'two') expect(kinds.has('cone')).toBe(false)
        }
    })

    it('fits the scene in the unit sphere, like the single forms', () => {
        for (const { solids } of combos) {
            for (const s of solids) expect(Math.hypot(...s.centre) + s.scale).toBeLessThan(1 + 1e-9)
        }
    })

    it('runs every form into another, without one swallowing another', () => {
        for (const { solids, meets } of combos) {
            expect(meets.length).toBeGreaterThan(0)
            solids.forEach((a, i) => {
                const others = solids.filter((_, j) => j !== i)
                expect(others.some((b) => meetLine(a, b, 48).length > 0)).toBe(true)
                for (const b of others) expect(shareInside(a, b, 28)).toBeLessThan(0.5)
            })
        }
    })

    it('leaves a good part of every form in view', () => {
        for (const { solids } of combos) {
            for (const share of sharesSeen(solids)) expect(share).toBeGreaterThan(0.4)
        }
    })
})

describe('comboFromSeed', () => {
    it('is deterministic and differs between seeds', () => {
        expect(comboFromSeed(48213, 'three')).toEqual(comboFromSeed(48213, 'three'))
        expect(comboFromSeed(48213, 'three').solids).not.toEqual(comboFromSeed(7, 'three').solids)
    })

    it('keeps poses stable, so shared links still show the same forms', () => {
        const { solids } = comboFromSeed(48213, 'three')
        expect(describeForms(solids)).toBe('Cylinder, box and sphere')
        expect(solids[0].centre[0]).toBeCloseTo(-0.22394691441270148, 10)
        expect(solids[0].centre[1]).toBeCloseTo(0.3322164903266338, 10)
        expect(solids[1].scale).toBeCloseTo(0.4961712690375406, 10)
    })
})

describe('uniform size', () => {
    it('makes every cylinder and cone twice as long as it is wide', () => {
        for (const seed of SEEDS) {
            for (const s of comboFromSeed(seed, 'four', true).solids) {
                if (s.kind === 'cylinder' || s.kind === 'cone') expect(s.proportion).toBe(2)
            }
        }
    })

    it('leaves the pose alone otherwise', () => {
        expect(comboFromSeed(48213, 'three', false)).toEqual(comboFromSeed(48213, 'three'))
    })
})

describe('describeForms', () => {
    it('lists the forms in a sentence', () => {
        const { solids } = comboFromSeed(48213, 'two')
        expect(describeForms(solids)).toMatch(/^[A-Z][a-z]+ and [a-z]+$/)
    })
})
