import { Route, Routes } from 'react-router'
import { HomePage } from './site/HomePage'
import { NotFoundPage } from './site/NotFoundPage'
import { SiteLayout } from './site/SiteLayout'
import { ToolPage } from './site/ToolPage'
import { TOOLS } from './tools/registry'

export default function App() {
    return (
        <Routes>
            <Route element={<SiteLayout />}>
                <Route index element={<HomePage />} />
                {TOOLS.map((tool) => (
                    <Route key={tool.slug} path={tool.slug} element={<ToolPage tool={tool} />} />
                ))}
                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    )
}