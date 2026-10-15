import { useContext, useEffect, useReducer, useRef, useState } from 'react'
import { parseInterval } from './countdown'
import { canGoBack, canGoForward } from './poseHistory'
import { PracticeContext } from './practice'
import { buildShareUrl, randomSeed, readSeedFromUrl } from './seed'
import { initialTimerState, timerReducer } from './timerState'

/**
 * Everything a seeded tool needs besides its drawing: the current seed (from a ?seed= link
 * or random), the auto-randomize timer, the last few poses for Back and Forward, and keeping
 * the address bar in sync.
 *
 * `fit` adjusts each random seed before it's shown, so a tool can limit which poses Randomize
 * and the timer pick. Seeds from a link or typed in are shown as they are.
 *
 * In a practice session (see practice.ts) the timer starts by itself at the step's interval, a
 * new random pose comes first rather than the link's, and the address bar is left alone.
 */
export function useSeedSession(fit: (seed: number) => number = (seed) => seed) {
    // The latest `fit`, for the timer, which keeps running across renders.
    const fitRef = useRef(fit)
    useEffect(() => {
        fitRef.current = fit
    })
    const newSeed = () => fitRef.current(randomSeed())
    const practice = useContext(PracticeContext)
    const practiceRef = useRef(practice)
    useEffect(() => {
        practiceRef.current = practice
    })

    // The seed is the single source of truth for what's on screen. A ?seed= link wins on first load.
    // It lives with the timer so a tick that runs out can swap the seed in the same update.
    const [{ seed, history, running, countdown }, dispatch] = useReducer(
        timerReducer,
        undefined,
        () =>
            practice
                ? timerReducer(initialTimerState(fit(randomSeed())), {
                      type: 'start',
                      interval: practice.seconds,
                  })
                : initialTimerState(readSeedFromUrl(window.location.search) ?? fit(randomSeed())),
    )
    const [intervalText, setIntervalText] = useState(() => String(practice?.seconds ?? 30))
    const seconds = parseInterval(intervalText)

    // Keep the address bar in sync, so the current URL is always a shareable link. A practice
    // session has its own page, so it's told about the pose instead.
    useEffect(() => {
        if (practiceRef.current) {
            practiceRef.current.onShow(seed)
            return
        }
        window.history.replaceState(
            window.history.state,
            '',
            buildShareUrl(window.location.href, seed),
        )
    }, [seed])

    // In a practice session, report each pose whose time ran out: the one on screen just before
    // the tick that fired. Only that tick has `fired` set, so this runs once per pose.
    const shownRef = useRef(seed)
    useEffect(() => {
        if (countdown?.fired && practiceRef.current) {
            // A step's last pose ends with nothing left on the clock (see timerState.ts).
            practiceRef.current.onPoseDone(shownRef.current, countdown.remaining === 0)
        }
    }, [countdown])
    useEffect(() => {
        shownRef.current = seed
    })

    // Tick once per second while running. Each tick carries the seed to show if time is up.
    useEffect(() => {
        if (!running || seconds === null) return
        const id = window.setInterval(() => {
            // The last pose of a practice step ends the run instead of bringing another.
            const last = (practiceRef.current?.posesLeft ?? 0) === 1
            dispatch({ type: 'tick', interval: seconds, nextSeed: newSeed(), last })
        }, 1000)
        return () => window.clearInterval(id)
    }, [running, seconds])

    // Any manual change restarts the countdown while the timer is running.
    const showSeed = (next: number) => dispatch({ type: 'showSeed', seed: next, interval: seconds })
    // Back and forward through this session's poses, so a skipped one isn't lost.
    const back = () => dispatch({ type: 'step', step: -1, interval: seconds })
    const forward = () => dispatch({ type: 'step', step: 1, interval: seconds })

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
        /** The interval is set by a practice session and can't be changed here. */
        intervalLocked: practice !== null,
        showSeed,
        back,
        forward,
        canGoBack: canGoBack(history),
        canGoForward: canGoForward(history),
        /** Where the current pose is in the history, counting from 1, and how many it holds. */
        historyPosition: { current: history.index + 1, total: history.seeds.length },
        randomize: () => showSeed(newSeed()),
        toggle,
        changeInterval,
    }
}

export type SeedSession = ReturnType<typeof useSeedSession>
