import { tick, type Countdown } from './countdown.ts'
import {
    currentSeed,
    pushPose,
    startHistory,
    stepHistory,
    type PoseHistory,
} from './poseHistory.ts'

/** The pose seed together with the auto-randomize timer that can replace it. */
export interface TimerState {
    seed: number // always the history's current pose
    history: PoseHistory
    running: boolean
    countdown: Countdown | null // null until the timer is first started
}

export type TimerAction =
    | { type: 'tick'; interval: number; nextSeed: number }
    | { type: 'showSeed'; seed: number; interval: number | null }
    | { type: 'step'; step: -1 | 1; interval: number | null }
    | { type: 'start'; interval: number }
    | { type: 'pause' }
    | { type: 'intervalChanged' }

export function initialTimerState(seed: number): TimerState {
    return { seed, history: startHistory(seed), running: false, countdown: null }
}

// Shows a pose from the history. Any manual change restarts the countdown while running.
function showHistory(state: TimerState, history: PoseHistory, interval: number | null): TimerState {
    return {
        ...state,
        history,
        seed: currentSeed(history),
        countdown:
            state.running && interval !== null
                ? { remaining: interval, fired: false }
                : state.countdown,
    }
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
    switch (action.type) {
        // One second has passed. When time runs out, switch to the seed picked by the caller.
        case 'tick': {
            if (!state.countdown) return state
            const countdown = tick(state.countdown, action.interval)
            if (!countdown.fired) return { ...state, countdown }
            const history = pushPose(state.history, action.nextSeed)
            return { ...state, countdown, history, seed: currentSeed(history) }
        }
        // A new pose, from Randomize or a typed seed. It goes on the end of the history.
        case 'showSeed':
            return showHistory(state, pushPose(state.history, action.seed), action.interval)
        // Back or forward through the poses shown so far. At either end, nothing changes.
        case 'step': {
            const history = stepHistory(state.history, action.step)
            return history === state.history ? state : showHistory(state, history, action.interval)
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
