import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App'
import { SITE_NAME } from './site/config'
import { TOOLS } from './tools/registry'

const render = (path: string) =>
    renderToString(
        <MemoryRouter initialEntries={[path]}>
            <App />
        </MemoryRouter>,
    )

describe('routing', () => {
    it('shows the home page at /, with a link to every tool', () => {
        const html = render('/')
        expect(html).toContain(SITE_NAME)
        for (const tool of TOOLS) {
            expect(html).toContain(tool.name)
            expect(html).toContain(`href="/${tool.slug}"`)
        }
    })

    it('wraps pages in the site layout, with a nav link per tool', () => {
        const html = render('/')
        expect(html).toContain('class="site-header"')
        expect(html).toContain('aria-label="Tools"')
    })

    it('shows a not-found page, still inside the layout, for unknown addresses', () => {
        const html = render('/definitely-not-a-page')
        expect(html).toContain('Page not found')
        expect(html).toContain('class="site-header"')
    })
})