import { useEffect } from 'react'

/** Sets the browser tab title, which also labels this page in the history menu. */
export function useDocumentTitle(title: string) {
    useEffect(() => {
        document.title = title
    }, [title])
}
