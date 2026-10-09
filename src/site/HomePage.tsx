import { Link } from 'react-router'
import { TOOLS } from '../tools/registry'
import { SITE_NAME } from './config'
import { useDocumentTitle } from './useDocumentTitle'

export function HomePage() {
    useDocumentTitle(SITE_NAME)
    return (
        <>
            <h1>{SITE_NAME}</h1>
            <p>Simple, browser-based drawing tools for art practice.</p>
            <ul className="tool-list">
                {TOOLS.map((tool) => (
                    <li key={tool.slug} className="tool-card">
                        <h2>
                            <Link to={`/${tool.slug}`}>{tool.name}</Link>
                        </h2>
                        <p>{tool.description}</p>
                    </li>
                ))}
            </ul>
        </>
    )
}