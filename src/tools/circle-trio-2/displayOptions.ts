import { defineOptions } from '../shared/options'
import { CIRCLE_FIELDS } from '../circle-trio/displayOptions'

/** The same Display panel as Circle Trio 1, with its own saved choices. */
export const CIRCLE_TRIO_2_OPTIONS = defineOptions(
    'sphere-studio:circle-trio-2:display',
    CIRCLE_FIELDS,
)
