import { describe, expect, it } from 'vitest'
import { TOOL_GROUPS, TOOLS, toolSections, type Tool } from './registry'

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

    it('puts every tool in a group that exists', () => {
        const ids: readonly string[] = TOOL_GROUPS.map((g) => g.id)
        for (const t of TOOLS) expect(ids).toContain(t.group)
    })
})

describe('toolSections', () => {
    const tool = (slug: string, group?: Tool['group']): Tool => ({
        ...TOOLS[0],
        slug,
        group,
    })

    it('lists every tool exactly once', () => {
        const slugs = toolSections().flatMap((s) => s.tools.map((t) => t.slug))
        expect(slugs.sort()).toEqual(TOOLS.map((t) => t.slug).sort())
    })

    it('follows the group order, keeps tool order, skips empty groups, and puts ungrouped tools last', () => {
        const sections = toolSections([
            tool('a', 'shapes'),
            tool('b'),
            tool('c', 'forms'),
            tool('d', 'shapes'),
        ])
        expect(sections.map((s) => [s.group?.id, s.tools.map((t) => t.slug)])).toEqual([
            ['forms', ['c']],
            ['shapes', ['a', 'd']],
            [undefined, ['b']],
        ])
    })

    it('has no sections when there are no tools', () => {
        expect(toolSections([])).toEqual([])
    })
})
