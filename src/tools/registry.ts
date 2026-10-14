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
import { CircleTrio1 } from './circle-trio/CircleTrio1'
import { drawCircleExample } from './circle-trio/example'
import { CircleTrio2 } from './circle-trio-2/CircleTrio2'
import { drawCircleTrio2Example } from './circle-trio-2/example'

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
}

/** Every tool on the site. Adding an entry here adds its route, nav link, and home-page card. */
export const TOOLS: readonly Tool[] = [
    {
        slug: 'sphere-randomizer',
        name: 'Sphere Randomizer',
        description:
            'A randomly rotated sphere split into eight sectors, with a timer and shareable poses, to practice drawing a face for a random direction.',
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
        slug: 'cone-randomizer',
        name: 'Cone Randomizer',
        description:
            'A cone in a random orientation and proportion, with its axis marked, for practicing the base ellipse and the side lines that meet it.',
        component: ConeRandomizer,
        drawExample: drawConeExample,
    },
    {
        slug: 'lit-sphere',
        name: 'Lit Sphere',
        description:
            'A sphere on a floor with the light coming from a random direction, showing the light side, core shadow, reflected light and cast shadow, for practicing light and shadow.',
        component: LitSphere,
        drawExample: drawLitSphereExample,
    },
    {
        slug: 'circle-trio-1',
        name: 'Circle Trio 1',
        description:
            'Two large translucent circles and a smaller one near the line between them, in a new arrangement each time, for practicing drawing faces with a random shape/form.',
        component: CircleTrio1,
        drawExample: drawCircleExample,
        formerSlugs: ['circle-trio'],
    },
    {
        slug: 'circle-trio-2',
        name: 'Circle Trio 2',
        description:
            'One large translucent circle and two smaller ones close together on its edge, inside, across or outside it, for practicing drawing faces with a random shape/form.',
        component: CircleTrio2,
        drawExample: drawCircleTrio2Example,
    },
]
