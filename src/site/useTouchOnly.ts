import { useSyncExternalStore } from 'react'

// No mouse or trackpad to hover with, only a finger: a phone or tablet. These usually have no
// keyboard either, so keyboard shortcuts and the full-screen button aren't offered there.
const QUERY = '(hover: none) and (pointer: coarse)'

const media = () =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(QUERY) : null

const subscribe = (onChange: () => void) => {
    const list = media()
    list?.addEventListener('change', onChange)
    return () => list?.removeEventListener('change', onChange)
}

const getSnapshot = () => media()?.matches ?? false

/** True on touch-only devices (phones, tablets). Follows changes, e.g. a tablet docked to a mouse. */
export function useTouchOnly(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
