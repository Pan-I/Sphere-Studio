import { useCallback, useEffect, useState, type RefObject } from 'react'

/**
 * Shows one element on its own, filling the screen. Uses the browser's Fullscreen API where it
 * can. Where it can't (iPhone Safari, or an embedded page that isn't allowed), `active` still
 * turns on and the element's CSS takes over the window instead, so a focus mode works everywhere.
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>) {
    const [native, setNative] = useState(false) // the browser's own full screen
    const [fallback, setFallback] = useState(false) // CSS-only focus mode

    // Track the browser's state, which also changes when someone presses Esc.
    useEffect(() => {
        const sync = () => setNative(document.fullscreenElement === ref.current)
        document.addEventListener('fullscreenchange', sync)
        return () => document.removeEventListener('fullscreenchange', sync)
    }, [ref])

    const active = native || fallback

    const exit = useCallback(() => {
        setFallback(false)
        if (document.fullscreenElement) void document.exitFullscreen()
    }, [])

    const enter = useCallback(() => {
        const el = ref.current
        if (!el) return
        if (!document.fullscreenEnabled || !el.requestFullscreen) {
            setFallback(true)
            return
        }
        el.requestFullscreen().catch(() => setFallback(true))
    }, [ref])

    const toggle = useCallback(() => (active ? exit() : enter()), [active, enter, exit])

    return { active, native, enter, exit, toggle }
}
