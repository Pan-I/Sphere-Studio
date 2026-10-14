import { useEffect, useState } from 'react'
import { CHIME_KEY, loadChime, playChime, saveChime, unlockAudio } from './chime'

/** The chime on or off, remembered between visits and shared by every tool. */
export function useChime() {
    const [on, setOn] = useState(loadChime)

    // Turning it off in another tab turns it off here too.
    useEffect(() => {
        const reload = (e: StorageEvent) => {
            if (e.key === null || e.key === CHIME_KEY) setOn(loadChime())
        }
        window.addEventListener('storage', reload)
        return () => window.removeEventListener('storage', reload)
    }, [])

    const toggle = () => {
        const next = !on
        setOn(next)
        saveChime(next)
        // Turning it on plays it once, so you hear how loud it is (and the browser allows sound).
        if (next) {
            unlockAudio()
            playChime()
        }
    }

    return { on, toggle }
}
