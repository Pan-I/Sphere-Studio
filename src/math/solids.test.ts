// src/math/solids.test.ts
import { describe, expect, it } from 'vitest'
import { proportionFromPick } from './cylinder'
import { randomQuat, type Vec3 } from './quat'
import { mulberry32 } from './random'
import {
    inside,
    localInside,
    span,
    surfacePatches,
    toLocal,
    toWorld,
    type Solid,
    type SolidKind,
} from './solids'

const KINDS: readonly SolidKind[] = ['sphere', 'box', 'cylinder', 'cone']

/** 40 placed solids of each kind, the same ones every run. */
const randomSolids = (): Solid[] => {
    const rand = mulberry32(7)
    return KINDS.flatMap((kind) =>
        Array.from({ length: 40 }, (): Solid => {
            const q = randomQuat(rand)
            return {
                kind,
                q,
                proportion: proportionFromPick(rand()),
                scale: 0.3 + rand(),
                centre: [rand() - 0.5, rand() - 0.5, rand() - 0.5],
            }
        }),
    )
}

const at = (o: Vec3, d: Vec3, t: number): Vec3 => [
    o[0] + d[0] * t,
    o[1] + d[1] * t,
    o[2] + d[2] * t,
]

describe('placing a solid', () => {
    it('moves points into its own frame and back', () => {
        for (const s of randomSolids()) {
            const p: Vec3 = [0.3, -0.2, 0.7]
            toWorld(s, toLocal(s, p)).forEach((v, i) => expect(v).toBeCloseTo(p[i], 10))
        }
    })
})

describe('surfacePatches', () => {
    it('puts every grid point on the surface', () => {
        for (const kind of KINDS) {
            for (const proportion of [0.5, 1, 3]) {
                for (const patch of surfacePatches(kind, proportion, 24)) {
                    for (const [u, v] of [
                        [0, 0],
                        [0.3, 0.7],
                        [1, 1],
                        [0.5, 0.01],
                    ]) {
                        expect(localInside(kind, proportion, patch.point(u, v))).toBeCloseTo(0, 10)
                    }
                }
            }
        }
    })

    it('knows the area of each surface', () => {
        const total = (kind: SolidKind, proportion = 1) =>
            surfacePatches(kind, proportion, 24).reduce((sum, p) => sum + p.area, 0)
        expect(total('sphere')).toBeCloseTo(4 * Math.PI)
        expect(total('box')).toBeCloseTo(6 * (2 / Math.sqrt(3)) ** 2)
        // Proportion 1: radius and half length are both 1/√2.
        const r = Math.SQRT1_2
        expect(total('cylinder')).toBeCloseTo(2 * Math.PI * r * 2 * r + 2 * Math.PI * r * r)
        expect(total('cone')).toBeCloseTo(Math.PI * r * Math.hypot(r, 2 * r) + Math.PI * r * r)
    })
})

describe('span', () => {
    it('agrees with the inside test along random rays', () => {
        const rand = mulberry32(99)
        for (const s of randomSolids()) {
            for (let n = 0; n < 20; n++) {
                const o: Vec3 = [rand() * 6 - 3, rand() * 6 - 3, 4]
                const d: Vec3 = [rand() - 0.5, rand() - 0.5, -1]
                const hit = span(s, o, d)
                for (let k = 0; k <= 50; k++) {
                    const t = 2 + (k / 50) * 6
                    const inSpan = hit !== null && t > hit.t0 + 1e-9 && t < hit.t1 - 1e-9
                    const outSpan = hit === null || t < hit.t0 - 1e-9 || t > hit.t1 + 1e-9
                    const value = inside(s, at(o, d, t))
                    if (inSpan) expect(value).toBeLessThan(1e-9)
                    if (outSpan) expect(value).toBeGreaterThan(-1e-9)
                }
                if (hit) {
                    // Where it goes in and out is on the surface.
                    expect(inside(s, at(o, d, hit.t0))).toBeCloseTo(0, 8)
                    expect(inside(s, at(o, d, hit.t1))).toBeCloseTo(0, 8)
                }
            }
        }
    })

    it('says which face a ray goes in through', () => {
        const unturned = (kind: SolidKind): Solid => ({
            kind,
            q: [0, 0, 0, 1],
            proportion: 2,
            scale: 1,
            centre: [0, 0, 0],
        })
        const down: Vec3 = [0, -1, 0]
        const across: Vec3 = [0, 0, -1]
        expect(span(unturned('box'), [0, 5, 0], down)?.face).toBe(1)
        expect(span(unturned('box'), [0, 0, 5], across)?.face).toBe(2)
        expect(span(unturned('cylinder'), [0, 5, 0], down)?.face).toBe(1)
        expect(span(unturned('cylinder'), [0, 0, 5], across)?.face).toBe(0)
        expect(span(unturned('cone'), [0, -5, 0], [0, 1, 0])?.face).toBe(1)
        expect(span(unturned('cone'), [0, 5, 0], down)?.face).toBe(0)
        // A ray past the apex misses the cone, though it meets the cone's mirror image above.
        expect(span(unturned('cone'), [0.5, 2, 5], across)).toBeNull()
    })
})
