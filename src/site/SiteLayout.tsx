import { useEffect, useRef, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useMatch } from 'react-router'
import { toolSections } from '../tools/registry'
import { SITE_NAME } from './config'
import { ThemeToggle } from './ThemeToggle'

function PageLink({ to, children }: { to: string; children: ReactNode }) {
    const isCurrent = useMatch(to) !== null
    return (
        <NavLink
            to={to}
            // Clicking the page you're already on would only strip ?seed= from the address bar (or,
            // on Practice, do nothing).
            onClick={(e) => {
                if (isCurrent) e.preventDefault()
            }}
        >
            {children}
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
                    <PageLink to="/practice">Practice</PageLink>
                    <PageLink to="/worksheet">Worksheet</PageLink>
                    {toolSections().map(({ group, tools }) => (
                        <div
                            key={group?.id ?? 'other'}
                            className="nav-group"
                            role="group"
                            aria-label={group?.name}
                        >
                            {group && (
                                <span className="nav-group-label" aria-hidden="true">
                                    {group.name}
                                </span>
                            )}
                            {tools.map((tool) => (
                                <PageLink key={tool.slug} to={`/${tool.slug}`}>
                                    {tool.name}
                                </PageLink>
                            ))}
                        </div>
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
