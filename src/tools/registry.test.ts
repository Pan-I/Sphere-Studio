import { describe, expect, it } from 'vitest'
import { TOOLS } from './registry'

describe('TOOLS registry', () => {
    it('lists at least one tool', () => {
        expect(TOOLS.length).toBeGreaterThan(0)
    })

    it('uses unique slugs, so no two tools share a route', () => {
        const slugs = TOOLS.map((t) => t.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
    })

    it('uses lowercase, URL-safe slugs', () => {
        for (const { slug, formerSlugs = [] } of TOOLS) {
            for (const s of [slug, ...formerSlugs]) {
                expect(s).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
            }
        }
    })

    it('never reuses a former slug, so every old link has one place to go', () => {
        const all = TOOLS.flatMap((t) => [t.slug, ...(t.formerSlugs ?? [])])
        expect(new Set(all).size).toBe(all.length)
    })

    it('gives every tool a name and a description', () => {
        for (const t of TOOLS) {
            expect(t.name.trim()).not.toBe('')
            expect(t.description.trim()).not.toBe('')
        }
    })
})
