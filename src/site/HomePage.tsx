import { Link } from 'react-router'
import { TOOLS } from '../tools/registry'
import { SITE_NAME } from './config'
import { ToolThumbnail } from './ToolThumbnail'
import { useDocumentTitle } from './useDocumentTitle'

export function HomePage() {
    useDocumentTitle(SITE_NAME)
    return (
        <>
            <h1>{SITE_NAME}</h1>
            <p>Simple, browser-based drawing tools for art practice. Initial tools (Sphere Randomizer, Circle Trio 1 & 2) were inspired by exercises in the 'Loomis Method' for drawing characters.
                These tools run completely on the front-end; no data is saved after a session is closed. Seeds can be copied for loading later or sharing. </p>
            <p className="home-practice">
                <Link to="/practice">Practice session</Link>: line up several tools, like 5 spheres
                at 60s and then 5 trios at 90s, and draw through them on one timer.
            </p>
            <p className="home-practice">
                <Link to="/worksheet">Worksheet</Link>: a page of 6 or 12 poses from one tool, to
                print and draw from on paper.
            </p>
            <ul className="tool-list">
                {TOOLS.map((tool) => (
                    <li key={tool.slug} className="tool-card">
                        <ToolThumbnail tool={tool} />
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
