import { Link, NavLink, Outlet, useMatch } from 'react-router'
import { TOOLS, type Tool } from '../tools/registry'
import { SITE_NAME } from './config'

function ToolLink({ tool }: { tool: Tool }) {
    const to = `/${tool.slug}`
    const isCurrent = useMatch(to) !== null
    return (
        <NavLink
            to={to}
            // Clicking the page you're already on would only strip ?seed= from the address bar.
            onClick={(e) => {
                if (isCurrent) e.preventDefault()
            }}
        >
            {tool.name}
        </NavLink>
    )
}

export function SiteLayout() {
    return (
        <>
            <header className="site-header">
                <Link to="/" className="site-title">{SITE_NAME}</Link>
                <nav className="site-nav" aria-label="Tools">
                    {TOOLS.map((tool) => (
                        <ToolLink key={tool.slug} tool={tool} />
                    ))}
                </nav>
            </header>
            <main className="site-main">
                <Outlet />
            </main>
        </>
    )
}