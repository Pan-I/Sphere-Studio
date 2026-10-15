import type { ComponentType } from 'react'
import { SphereRandomizer } from './sphere-randomizer/SphereRandomizer'
import { drawSphereExample } from './sphere-randomizer/example'
import { BoxRandomizer } from './box-randomizer/BoxRandomizer'
import { drawBoxExample } from './box-randomizer/example'
import { CylinderRandomizer } from './cylinder-randomizer/CylinderRandomizer'
import { drawCylinderExample } from './cylinder-randomizer/example'
import { ConeRandomizer } from './cone-randomizer/ConeRandomizer'
import { drawConeExample } from './cone-randomizer/example'
import { LitSphere } from './lit-sphere/LitSphere'
import { drawLitSphereExample } from './lit-sphere/example'
import { ValueStudy } from './value-study/ValueStudy'
import { drawValueStudyExample } from './value-study/example'
import { PerspectiveGrid } from './perspective-grid/PerspectiveGrid'
import { drawPerspectiveGridExample } from './perspective-grid/example'
import { FormCombo } from './form-combo/FormCombo'
import { drawFormComboExample } from './form-combo/example'
import { CircleTrio1 } from './circle-trio/CircleTrio1'
import { drawCircleExample } from './circle-trio/example'
import { CircleTrio2 } from './circle-trio-2/CircleTrio2'
import { drawCircleTrio2Example } from './circle-trio-2/example'

/**
 * The headed groups the home page and the header list tools under, in this order. A group with no
 * tools yet isn't shown, so a group can be listed here before its first tool exists.
 */
export const TOOL_GROUPS = [
    { id: 'forms', name: 'Forms' },
    { id: 'value', name: 'Value' },
    { id: 'perspective', name: 'Perspective' },
    { id: 'shapes', name: 'Shapes' },
] as const

export type ToolGroupId = (typeof TOOL_GROUPS)[number]['id']

export interface Tool {
    /** URL segment, e.g. "sphere-randomizer" is served at /sphere-randomizer. */
    slug: string
    name: string
    description: string
    component: ComponentType
    /**
     * Draws the picture for `seed` on a square canvas `size` units wide, with default options and
     * nothing from the tool's page. The home-page card uses it for a small live example.
     */
    drawExample: (ctx: CanvasRenderingContext2D, size: number, seed: number) => void
    /** Earlier slugs, which redirect here (keeping `?seed=`) so old links still work. */
    formerSlugs?: readonly string[]
    /** The group the tool is listed under. A tool without one is listed after the groups. */
    group?: ToolGroupId
    /** False leaves the tool out of practice sessions, e.g. one that works on your own photo. */
    practice?: boolean
}

/** Every tool on the site. Adding an entry here adds its route, nav link, and home-page card, under its group. */
export const TOOLS: readonly Tool[] = [
    {
        slug: 'sphere-randomizer',
        group: 'forms',
        name: 'Sphere Randomizer',
        description:
            'A randomly rotated sphere split into eight sectors, with a timer and shareable poses, to practice drawing a face for a random direction.',
        component: SphereRandomizer,
        drawExample: drawSphereExample,
    },
    {
        slug: 'box-randomizer',
        group: 'forms',
        name: 'Box Randomizer',
        description:
            'A cube in a random orientation, with the faces that point at you shaded and the hidden edges shown faintly, for practicing boxes.',
        component: BoxRandomizer,
        drawExample: drawBoxExample,
    },
    {
        slug: 'cylinder-randomizer',
        group: 'forms',
        name: 'Cylinder Randomizer',
        description:
            'A cylinder in a random orientation and proportion, with its axis marked, for practicing ellipses and lining up their minor axis.',
        component: CylinderRandomizer,
        drawExample: drawCylinderExample,
    },
    {
        slug: 'cone-randomizer',
        group: 'forms',
        name: 'Cone Randomizer',
        description:
            'A cone in a random orientation and proportion, with its axis marked, for practicing the base ellipse and the side lines that meet it.',
        component: ConeRandomizer,
        drawExample: drawConeExample,
    },
    {
        slug: 'form-combo',
        group: 'forms',
        name: 'Form Combo',
        description:
            'A sphere, box and cylinder in random orientations, pushed into each other, with the lines where they meet marked, for practicing forms that intersect.',
        component: FormCombo,
        drawExample: drawFormComboExample,
    },
    {
        slug: 'lit-sphere',
        group: 'value',
        name: 'Lit Sphere',
        description:
            'A sphere on a floor with the light coming from a random direction, showing the light side, core shadow, reflected light and cast shadow, for practicing light and shadow.',
        component: LitSphere,
        drawExample: drawLitSphereExample,
    },
    {
        slug: 'value-study',
        group: 'value',
        name: 'Value Study',
        description:
            'Load a photo and see it in grayscale and grouped into 3, 5 or 7 flat values, for planning the big light and dark shapes. The photo never leaves your browser.',
        component: ValueStudy,
        drawExample: drawValueStudyExample,
        practice: false,
    },
    {
        slug: 'perspective-grid',
        group: 'perspective',
        name: 'Perspective Grid',
        description:
            'A random 1, 2 or 3 point perspective grid with the horizon and vanishing points marked, for practicing boxes in a scene.',
        component: PerspectiveGrid,
        drawExample: drawPerspectiveGridExample,
    },
    {
        slug: 'circle-trio-1',
        group: 'shapes',
        name: 'Circle Trio 1',
        description:
            'Two large translucent circles and a smaller one near the line between them, in a new arrangement each time, for practicing drawing faces with a random shape/form.',
        component: CircleTrio1,
        drawExample: drawCircleExample,
        formerSlugs: ['circle-trio'],
    },
    {
        slug: 'circle-trio-2',
        group: 'shapes',
        name: 'Circle Trio 2',
        description:
            'One large translucent circle and two smaller ones close together on its edge, inside, across or outside it, for practicing drawing faces with a random shape/form.',
        component: CircleTrio2,
        drawExample: drawCircleTrio2Example,
    },
]

export interface ToolSection {
    /** Undefined for the tools that have no group. */
    group?: (typeof TOOL_GROUPS)[number]
    tools: readonly Tool[]
}

/**
 * `tools` split into one section per group that has any, in TOOL_GROUPS order, then the tools with
 * no group. Within a section the tools keep their order in `tools`.
 */
export function toolSections(tools: readonly Tool[] = TOOLS): ToolSection[] {
    const sections: ToolSection[] = TOOL_GROUPS.map((group) => ({
        group,
        tools: tools.filter((tool) => tool.group === group.id),
    }))
    sections.push({ tools: tools.filter((tool) => tool.group === undefined) })
    return sections.filter((section) => section.tools.length > 0)
}

/** The tools a practice session can use, in the site's order. */
export const PRACTICE_TOOLS: readonly Tool[] = TOOLS.filter((tool) => tool.practice !== false)
