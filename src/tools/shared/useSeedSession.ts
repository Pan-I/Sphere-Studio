import { useEffect, useReducer, useRef, useState } from 'react'
import { parseInterval } from './countdown'
import { buildShareUrl, randomSeed, readSeedFromUrl } from './seed'
import { initialTimerState, timerReducer } from './timerState'

/**
 * Everything a seeded tool needs besides its drawing: the current seed (from a ?seed= link
 * or random), the auto-randomize timer, and keeping the address bar in sync.
 *
 * `fit` adjusts each random seed before it's shown, so a tool can limit which poses Randomize
 * and the timer pick. Seeds from a link or typed in are shown as they are.
 */
export function useSeedSession(fit: (seed: number) => number = (seed) => seed) {
    // The latest `fit`, for the timer, which keeps running across renders.
    const fitRef = useRef(fit)
    useEffect(() => {
        fitRef.current = fit
    })
    const newSeed = () => fitRef.current(randomSeed())

    // The seed is the single source of truth for what's on screen. A ?seed= link wins on first load.
    // It lives with the timer so a tick that runs out can swap the seed in the same update.
    const [{ seed, running, countdown }, dispatch] = useReducer(timerReducer, undefined, () =>
        initialTimerState(readSeedFromUrl(window.location.search) ?? fit(randomSeed())),
    )
    const [intervalText, setIntervalText] = useState('30')
    const seconds = parseInterval(intervalText)

    // Keep the address bar in sync, so the current URL is always a shareable link.
    useEffect(() => {
        window.history.replaceState(
            window.history.state,
            '',
            buildShareUrl(window.location.href, seed),
        )
    }, [seed])

    // Tick once per second while running. Each tick carries the seed to show if time is up.
    useEffect(() => {
        if (!running || seconds === null) return
        const id = window.setInterval(() => {
            dispatch({ type: 'tick', interval: seconds, nextSeed: newSeed() })
        }, 1000)
        return () => window.clearInterval(id)
    }, [running, seconds])

    // Any manual change restarts the countdown while the timer is running.
    const showSeed = (next: number) => dispatch({ type: 'showSeed', seed: next, interval: seconds })

    const toggle = () => {
        if (running) {
            dispatch({ type: 'pause' })
            return
        }
        if (seconds === null) return
        dispatch({ type: 'start', interval: seconds })
    }

    const changeInterval = (text: string) => {
        setIntervalText(text)
        dispatch({ type: 'intervalChanged' }) // a new interval means a fresh countdown
    }

    return {
        seed,
        running,
        countdown,
        intervalText,
        seconds,
        showSeed,
        randomize: () => showSeed(newSeed()),
        toggle,
        changeInterval,
    }
}

export type SeedSession = ReturnType<typeof useSeedSession>
