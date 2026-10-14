import { createContext } from 'react'

/**
 * The slug of the tool on screen, set by the tool page, so shared controls can save things per
 * tool. Null when a tool is rendered on its own, e.g. in a test.
 */
export const ToolSlugContext = createContext<string | null>(null)
