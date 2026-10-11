import { tick, type Countdown } from './countdown'

/** The pose seed together with the auto-randomize timer that can replace it. */
export interface TimerState {
    seed: number
    running: boolean
    countdown: Countdown | null // null until the timer is first started
}

export type TimerAction =
    | { type: 'tick'; interval: number; nextSeed: number }
    | { type: 'showSeed'; seed: number; interval: number | null }
    | { type: 'start'; interval: number }
    | { type: 'pause' }
    | { type: 'intervalChanged' }

export function initialTimerState(seed: number): TimerState {
    return { seed, running: false, countdown: null }
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
    switch (action.type) {
        // One second has passed. When time runs out, switch to the seed picked by the caller.
        case 'tick': {
            if (!state.countdown) return state
            const countdown = tick(state.countdown, action.interval)
            return { ...state, countdown, seed: countdown.fired ? action.nextSeed : state.seed }
        }
        // Any manual pose change restarts the countdown while the timer is running.
        case 'showSeed':
            return {
                ...state,
                seed: action.seed,
                countdown:
                    state.running && action.interval !== null
                        ? { remaining: action.interval, fired: false }
                        : state.countdown,
            }
        // Start a fresh countdown, or resume a paused one.
        case 'start':
            return {
                ...state,
                running: true,
                countdown: state.countdown ?? { remaining: action.interval, fired: false },
            }
        case 'pause':
            return { ...state, running: false }
        // A new interval means a fresh countdown.
        case 'intervalChanged':
            return { ...state, countdown: null }
    }
}
