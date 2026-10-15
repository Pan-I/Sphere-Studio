import { useEffect } from 'react'

/**
 * Keeps the screen from dimming and locking while `active`, so a phone propped beside your paper
 * stays on through a long timer interval. Uses the Screen Wake Lock API, and does nothing where
 * the browser doesn't have it. The browser drops the lock when the tab is hidden, so it's taken
 * again when you come back.
 */
export function useWakeLock(active: boolean) {
    useEffect(() => {
        const wakeLock = typeof navigator !== 'undefined' ? navigator.wakeLock : undefined
        if (!active || !wakeLock) return
        let lock: WakeLockSentinel | null = null
        let stopped = false

        const acquire = async () => {
            if (document.visibilityState !== 'visible') return
            try {
                const next = await wakeLock.request('screen')
                if (stopped) void next.release()
                else {
                    void lock?.release()
                    lock = next
                }
            } catch {
                // Refused (low battery, or not allowed here). The timer works the same without it.
            }
        }
        const onVisible = () => {
            if (document.visibilityState === 'visible') void acquire()
        }

        void acquire()
        document.addEventListener('visibilitychange', onVisible)
        return () => {
            stopped = true
            document.removeEventListener('visibilitychange', onVisible)
            void lock?.release()
        }
    }, [active])
}
