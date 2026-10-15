import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useMatch } from 'react-router'
import { TOOLS, type Tool } from '../tools/registry'
import { SITE_NAME } from './config'
import { ThemeToggle } from './ThemeToggle'

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
    const navRef = useRef<HTMLElement>(null)
    const { pathname } = useLocation()

    // On phones the tool links scroll sideways in one row (see index.css). Bring the current
    // tool's link to the middle of that row, so you can see where you are.
    useEffect(() => {
        const nav = navRef.current
        const link = nav?.querySelector<HTMLElement>('a.active')
        if (!nav || !link || nav.scrollWidth <= nav.clientWidth) return
        const navBox = nav.getBoundingClientRect()
        const linkBox = link.getBoundingClientRect()
        nav.scrollLeft += linkBox.left - navBox.left - (navBox.width - linkBox.width) / 2
    }, [pathname])

    return (
        <>
            <header className="site-header">
                <Link to="/" className="site-title">
                    {SITE_NAME}
                </Link>
                <nav ref={navRef} className="site-nav" aria-label="Tools">
                    {TOOLS.map((tool) => (
                        <ToolLink key={tool.slug} tool={tool} />
                    ))}
                </nav>
                <ThemeToggle />
            </header>
            <main className="site-main">
                <Outlet />
            </main>
        </>
    )
}
