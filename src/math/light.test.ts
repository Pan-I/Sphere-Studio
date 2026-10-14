import { describe, expect, it } from 'vitest'
import {
    CONTACT,
    FLOOR_Y,
    RIGHT,
    UP,
    VIEW,
    floorPointAt,
    lightDirection,
    pointFromLight,
    sceneBounds,
    shadowEdgeAt,
    shadowOutline,
    sphereNormalAt,
    terminator,
    toView,
} from './light'
import { cross, dot, type Vec3 } from './quat'

const DEG = Math.PI / 180
const LIGHTS: Vec3[] = [
    lightDirection(30 * DEG, 30 * DEG),
    lightDirection(-90 * DEG, 45 * DEG),
    lightDirection(150 * DEG, 65 * DEG),
    lightDirection(-120 * DEG, 50 * DEG),
]
const len = (v: Vec3) => Math.hypot(...v)

describe('the view', () => {
    it('uses three screen axes at right angles, looking slightly down', () => {
        for (const [a, b] of [
            [RIGHT, UP],
            [UP, VIEW],
            [VIEW, RIGHT],
        ]) {
            expect(dot(a, b)).toBeCloseTo(0, 12)
        }
        expect(cross(RIGHT, UP)).toEqual(VIEW.map((v) => expect.closeTo(v, 12)))
        expect(VIEW[1]).toBeGreaterThan(0) // the viewer is above the floor's horizon
    })

    it('finds the sphere point under a screen point, with its normal facing the viewer', () => {
        expect(sphereNormalAt(1.01, 0)).toBeNull()
        const n = sphereNormalAt(0.3, -0.5)!
        expect(len(n)).toBeCloseTo(1, 12)
        const [x, y, depth] = toView(n)
        expect(x).toBeCloseTo(0.3, 12)
        expect(y).toBeCloseTo(-0.5, 12)
        expect(depth).toBeGreaterThan(0)
    })

    it('finds the floor point under a screen point', () => {
        for (const [x, y] of [
            [0, -1.5],
            [0.7, 2],
            [-1.2, 0.3],
        ]) {
            const g = floorPointAt(x, y)
            expect(g[1]).toBeCloseTo(FLOOR_Y, 12)
            expect(toView(g)[0]).toBeCloseTo(x, 12)
            expect(toView(g)[1]).toBeCloseTo(y, 12)
        }
    })
})

describe('lightDirection', () => {
    it('gives a unit vector at the right height', () => {
        const l = lightDirection(70 * DEG, 40 * DEG)
        expect(len(l)).toBeCloseTo(1, 12)
        expect(l[1]).toBeCloseTo(Math.sin(40 * DEG), 12)
    })

    it('puts positive azimuths on the right, small ones toward the viewer', () => {
        expect(lightDirection(60 * DEG, 40 * DEG)[0]).toBeGreaterThan(0)
        expect(lightDirection(-60 * DEG, 40 * DEG)[0]).toBeLessThan(0)
        expect(lightDirection(30 * DEG, 40 * DEG)[2]).toBeGreaterThan(0)
        expect(lightDirection(150 * DEG, 40 * DEG)[2]).toBeLessThan(0)
    })
})

describe('terminator and shadow', () => {
    it('puts the terminator on the sphere, at right angles to the light', () => {
        for (const light of LIGHTS) {
            for (const p of terminator(light, 32)) {
                expect(len(p)).toBeCloseTo(1, 12)
                expect(dot(p, light)).toBeCloseTo(0, 12)
            }
        }
    })

    it('puts the shadow edge on the floor, exactly at the edge of the shadow', () => {
        for (const light of LIGHTS) {
            for (const g of shadowOutline(light, 32)) {
                expect(g[1]).toBeCloseTo(FLOOR_Y, 12)
                expect(shadowEdgeAt(g, light).edge).toBeCloseTo(1, 9)
            }
        }
    })

    it('shades the floor under the sphere and not beside the light', () => {
        for (const light of LIGHTS) {
            expect(shadowEdgeAt(CONTACT, light).edge).toBeLessThan(1)
            const towardLight: Vec3 = [light[0] * 3, FLOOR_Y, light[2] * 3]
            expect(shadowEdgeAt(towardLight, light).edge).toBeGreaterThan(1)
        }
    })

    it('casts the shadow away from the light', () => {
        for (const light of LIGHTS) {
            const outline = shadowOutline(light, 64)
            const centre = outline.reduce<Vec3>(
                (a, p) => [a[0] + p[0] / 64, a[1], a[2] + p[2] / 64],
                [0, FLOOR_Y, 0],
            )
            expect(centre[0] * light[0] + centre[2] * light[2]).toBeLessThan(0)
        }
    })

    it('fits the sphere and every shadow edge point in the scene bounds', () => {
        for (const light of LIGHTS) {
            const box = sceneBounds(light)
            expect(box.minX).toBeLessThanOrEqual(-1)
            expect(box.maxY).toBeGreaterThanOrEqual(1)
            for (const g of shadowOutline(light, 50)) {
                const [x, y] = toView(g)
                expect(x).toBeGreaterThanOrEqual(box.minX - 0.01)
                expect(x).toBeLessThanOrEqual(box.maxX + 0.01)
                expect(y).toBeGreaterThanOrEqual(box.minY - 0.01)
                expect(y).toBeLessThanOrEqual(box.maxY + 0.01)
            }
        }
    })
})

describe('pointFromLight', () => {
    it('lands on the sphere at the asked angle from the light, facing the viewer', () => {
        for (const light of LIGHTS) {
            for (const [c, side] of [
                [0.25, -0.6],
                [-0.1, 0.6],
                [0.9, 0],
            ]) {
                const p = pointFromLight(light, c, side)
                expect(len(p)).toBeCloseTo(1, 12)
                expect(dot(p, light)).toBeCloseTo(c, 12)
                expect(toView(p)[2]).toBeGreaterThan(0)
            }
        }
    })
})
