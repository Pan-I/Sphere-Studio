import { describe, expect, it } from 'vitest'
import { shareInside } from '../../math/meet'
import { cutoutFromSeed, describeCutout, looseShare, sharesSeen, type CutsChoice } from './pose'

const SEEDS = [1, 77, 4242, 48213, 99999, 123456, 777777]

describe.each<[CutsChoice, number]>([
    ['one', 1],
    ['two', 2],
])('cutoutFromSeed with %s cut', (cuts, count) => {
    const cutouts = SEEDS.map((seed) => cutoutFromSeed(seed, cuts, true))

    it('makes the right number of cuts', () => {
        for (const c of cutouts) expect(c.cuts).toHaveLength(count)
    })

    it('fits the scene in the unit sphere, like the single forms', () => {
        for (const { main, cuts: all } of cutouts) {
            for (const s of [main, ...all]) {
                expect(Math.hypot(...s.centre) + s.scale).toBeLessThan(1 + 1e-9)
            }
        }
    })

    it('takes a real bite with every cut, without taking too much', () => {
        for (const c of cutouts) {
            expect(c.meets.length).toBeGreaterThan(0)
            for (const cut of c.cuts) {
                const bite = shareInside(cut, c.main, 28)
                expect(bite).toBeGreaterThan(0.1)
                expect(bite).toBeLessThan(0.75)
                expect(shareInside(c.main, cut, 28)).toBeLessThan(0.4)
            }
        }
    })

    it('turns every hollow toward you and keeps the form in one piece', () => {
        for (const c of cutouts) {
            const { outside, hollows } = sharesSeen(c)
            expect(outside).toBeGreaterThan(0.35)
            for (const share of hollows) expect(share).toBeGreaterThan(0.05)
            expect(looseShare(c)).toBeLessThan(0.03)
        }
    })
})

describe('cutoutFromSeed', () => {
    it('is deterministic and differs between seeds', () => {
        expect(cutoutFromSeed(48213, 'one')).toEqual(cutoutFromSeed(48213, 'one'))
        expect(cutoutFromSeed(48213, 'one').main).not.toEqual(cutoutFromSeed(7, 'one').main)
    })

    it('keeps poses stable, so shared links still show the same forms', () => {
        const c = cutoutFromSeed(48213, 'one', true)
        expect(describeCutout(c)).toBe('Box with a cone cut out of it')
        expect(c.cuts[0].centre[0]).toBeCloseTo(-0.049634179846728806, 10)
    })

    it('makes every cylinder and cone twice as long as it is wide with uniform size', () => {
        for (const seed of SEEDS) {
            const { main, cuts } = cutoutFromSeed(seed, 'two', true)
            for (const s of [main, ...cuts]) {
                if (s.kind === 'cylinder' || s.kind === 'cone') expect(s.proportion).toBe(2)
            }
        }
    })
})

describe('describeCutout', () => {
    it('names the form and what was cut out of it', () => {
        expect(describeCutout(cutoutFromSeed(5, 'two', true))).toMatch(
            /^[A-Z][a-z]+ with an? [a-z]+ and an? [a-z]+ cut out of it$/,
        )
    })
})
