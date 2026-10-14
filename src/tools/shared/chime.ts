/** The localStorage key for the chime setting. It's one setting for the whole site, not per tool. */
export const CHIME_KEY = 'sphere-studio:chime'

/** Whether the chime is on. It's on unless it was turned off, so bad data can't silence it. */
export function parseChime(raw: string | null): boolean {
    return raw !== 'off'
}

/** Reads the chime setting from the browser. On if it was never set or storage is blocked. */
export function loadChime(): boolean {
    try {
        return parseChime(window.localStorage.getItem(CHIME_KEY))
    } catch {
        return true
    }
}

export function saveChime(on: boolean) {
    try {
        if (on) window.localStorage.removeItem(CHIME_KEY)
        else window.localStorage.setItem(CHIME_KEY, 'off')
    } catch {
        // Storage unavailable: the setting just won't persist.
    }
}

/** A soft bell: a fundamental and two quieter overtones, each fading out on its own. */
const PARTIALS = [
    { frequency: 784, gain: 0.16, decay: 1.8 }, // G5
    { frequency: 1568, gain: 0.05, decay: 1.0 },
    { frequency: 2352, gain: 0.02, decay: 0.6 },
]

type AudioContextClass = typeof AudioContext

// One context for the whole page: browsers limit how many a page may open.
let context: AudioContext | null = null

function audioContext(): AudioContext | null {
    if (context) return context
    const Ctor: AudioContextClass | undefined =
        window.AudioContext ??
        (window as { webkitAudioContext?: AudioContextClass }).webkitAudioContext
    if (!Ctor) return null
    try {
        context = new Ctor()
    } catch {
        return null
    }
    return context
}

/**
 * Browsers keep sound off until the page is clicked or a key is pressed. Call this from a click
 * or key press (Start, P, ticking the Chime box) so the timer can chime later on its own.
 */
export function unlockAudio() {
    const ctx = audioContext()
    if (ctx?.state === 'suspended') void ctx.resume().catch(() => {})
}

/** Plays the chime. Silent where the browser has no Web Audio. */
export function playChime() {
    const ctx = audioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
    const now = ctx.currentTime
    for (const { frequency, gain, decay } of PARTIALS) {
        const osc = ctx.createOscillator()
        const env = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = frequency
        // A quick but not clicky attack, then an exponential fade, like a struck bell.
        env.gain.setValueAtTime(0.0001, now)
        env.gain.exponentialRampToValueAtTime(gain, now + 0.02)
        env.gain.exponentialRampToValueAtTime(0.0001, now + decay)
        osc.connect(env).connect(ctx.destination)
        osc.start(now)
        osc.stop(now + decay + 0.05)
    }
}

/** For tests: forget the audio context, so the next chime makes a new one. */
export function resetAudioForTests() {
    context = null
}
