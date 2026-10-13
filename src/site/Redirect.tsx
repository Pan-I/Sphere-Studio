import { Navigate, useLocation } from 'react-router'

/** Sends an old address to its new path, keeping the query (like `?seed=`) and the hash. */
export function Redirect({ to }: { to: string }) {
    const { search, hash } = useLocation()
    return <Navigate to={{ pathname: to, search, hash }} replace />
}
