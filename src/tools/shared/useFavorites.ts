import { useContext, useEffect, useState } from 'react'
import { loadFavorites, saveFavorites, toggleFavorite } from './favorites'
import { ToolSlugContext } from './toolSlug'

/**
 * The poses starred on this tool, newest first, remembered between visits. Without a tool page
 * around it (no slug), the stars last only until the tool goes away.
 */
export function useFavorites() {
    const slug = useContext(ToolSlugContext)
    const [favorites, setFavorites] = useState(() => (slug ? loadFavorites(slug) : []))

    // Another tab starring or unstarring on the same tool shows up here too.
    useEffect(() => {
        if (!slug) return
        const reload = () => setFavorites(loadFavorites(slug))
        window.addEventListener('storage', reload)
        return () => window.removeEventListener('storage', reload)
    }, [slug])

    const update = (next: number[]) => {
        setFavorites(next)
        if (slug) saveFavorites(slug, next)
    }

    return {
        favorites,
        isFavorite: (seed: number) => favorites.includes(seed),
        toggle: (seed: number) => update(toggleFavorite(favorites, seed)),
        remove: (seed: number) => update(favorites.filter((s) => s !== seed)),
    }
}
