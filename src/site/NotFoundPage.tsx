import { Link } from 'react-router'
import { SITE_NAME } from './config'
import { useDocumentTitle } from './useDocumentTitle'

export function NotFoundPage() {
    useDocumentTitle(`Page not found · ${SITE_NAME}`)
    return (
        <>
            <h1>Page not found</h1>
            <p>
                That address doesn't match anything here. <Link to="/">Back to all tools</Link>
            </p>
        </>
    )
}
