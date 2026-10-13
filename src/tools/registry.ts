import type { ComponentType } from 'react'
import { SphereRandomizer } from './sphere-randomizer/SphereRandomizer'
import { drawSphereExample } from './sphere-randomizer/example'
import { BoxRandomizer } from './box-randomizer/BoxRandomizer'
import { drawBoxExample } from './box-randomizer/example'
import { CylinderRandomizer } from './cylinder-randomizer/CylinderRandomizer'
import { drawCylinderExample } from './cylinder-randomizer/example'
import { CircleTrio } from './circle-trio/CircleTrio'
import { drawCircleExample } from './circle-trio/example'

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
}

/** Every tool on the site. Adding an entry here adds its route, nav link, and home-page card. */
export const TOOLS: readonly Tool[] = [
    {
        slug: 'sphere-randomizer',
        name: 'Sphere Randomizer',
        description:
            'A randomly rotated sphere split into eight sectors, with a timer and shareable poses, for form drawing practice.',
        component: SphereRandomizer,
        drawExample: drawSphereExample,
    },
    {
        slug: 'box-randomizer',
        name: 'Box Randomizer',
        description:
            'A cube in a random orientation, with the faces that point at you shaded and the hidden edges shown faintly, for practicing boxes.',
        component: BoxRandomizer,
        drawExample: drawBoxExample,
    },
    {
        slug: 'cylinder-randomizer',
        name: 'Cylinder Randomizer',
        description:
            'A cylinder in a random orientation and proportion, with its axis marked, for practicing ellipses and lining up their minor axis.',
        component: CylinderRandomizer,
        drawExample: drawCylinderExample,
    },
    {
        slug: 'circle-trio',
        name: 'Circle Trio',
        description:
            'Two large translucent circles and a smaller one between them, in a new arrangement each time, for practicing overlapping forms.',
        component: CircleTrio,
        drawExample: drawCircleExample,
    },
]
