import type { ComponentType } from 'react'
import { SphereRandomizer } from './sphere-randomizer/SphereRandomizer'

export interface Tool {
    /** URL segment, e.g. "sphere-randomizer" is served at /sphere-randomizer. */
    slug: string
    name: string
    description: string
    component: ComponentType
}

/** Every tool on the site. Adding an entry here adds its route, nav link, and home-page card. */
export const TOOLS: readonly Tool[] = [
    {
        slug: 'sphere-randomizer',
        name: 'Sphere Randomizer',
        description:
            'A randomly rotated sphere split into eight sectors, with a timer and shareable poses, for form drawing practice.',
        component: SphereRandomizer,
    },
]
