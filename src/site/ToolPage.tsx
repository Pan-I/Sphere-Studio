import type { Tool } from '../tools/registry'
import { SITE_NAME } from './config'
import { useDocumentTitle } from './useDocumentTitle'

export function ToolPage({ tool }: { tool: Tool }) {
    useDocumentTitle(`${tool.name} · ${SITE_NAME}`)
    const ToolComponent = tool.component
    return (
        <>
            <h1>{tool.name}</h1>
            <ToolComponent />
        </>
    )
}