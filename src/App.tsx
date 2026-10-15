import { Route, Routes } from 'react-router'
import { PracticePage } from './practice/PracticePage'
import { Redirect } from './site/Redirect'
import { ShortcutsProvider } from './shortcuts/ShortcutsProvider'
import { HomePage } from './site/HomePage'
import { NotFoundPage } from './site/NotFoundPage'
import { SiteLayout } from './site/SiteLayout'
import { ToolPage } from './site/ToolPage'
import { TOOLS } from './tools/registry'

export default function App() {
    return (
        <ShortcutsProvider>
            <Routes>
                <Route element={<SiteLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path="practice" element={<PracticePage />} />
                    {TOOLS.map((tool) => (
                        <Route
                            key={tool.slug}
                            path={tool.slug}
                            element={<ToolPage tool={tool} />}
                        />
                    ))}
                    {TOOLS.flatMap((tool) =>
                        (tool.formerSlugs ?? []).map((old) => (
                            <Route
                                key={old}
                                path={old}
                                element={<Redirect to={`/${tool.slug}`} />}
                            />
                        )),
                    )}
                    <Route path="*" element={<NotFoundPage />} />
                </Route>
            </Routes>
        </ShortcutsProvider>
    )
}
