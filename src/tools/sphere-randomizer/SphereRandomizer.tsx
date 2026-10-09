import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { pickMarker } from '../../math/sphere'
import { drawSphere } from './drawSphere'
import { DisplayControls } from './DisplayControls'
import { loadOptions, saveOptions } from './displayOptions'
import { MAX_SECONDS, MIN_SECONDS, parseInterval, tick, type Countdown } from './countdown'
import {
    MAX_SEED, buildShareUrl, parseSeed, poseFromSeed, randomSeed, readSeedFromUrl,
} from './seed'

const SIZE = 480

type CopyState = 'idle' | 'copied' | 'failed'

export function SphereRandomizer() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // The seed is the single source of truth for the pose. A ?seed= link wins on first load.
    const [seed, setSeed] = useState<number>(
        () => readSeedFromUrl(window.location.search) ?? randomSeed(),
    )
    const pose = useMemo(() => {
        const { q, markerPick } = poseFromSeed(seed)
        return { q, marker: pickMarker(q, markerPick) }
    }, [seed])

    const [seedText, setSeedText] = useState('')
    const [copyState, setCopyState] = useState<CopyState>('idle')
    const [intervalText, setIntervalText] = useState('30')
    const [running, setRunning] = useState(false)
    const [countdown, setCountdown] = useState<Countdown | null>(null)
    const [options, setOptions] = useState(loadOptions)

    const seconds = parseInterval(intervalText)
    const parsedSeed = parseSeed(seedText)
    const seedInvalid = seedText.trim() !== '' && parsedSeed === null

    // Draw whenever the orientation changes.
    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return
        const dpr = window.devicePixelRatio || 1
        canvas.width = SIZE * dpr
        canvas.height = SIZE * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        drawSphere(ctx, SIZE, pose.q, options, pose.marker)
    }, [pose, options])

    // Remember display preferences between visits.
    useEffect(() => {
        saveOptions(options)
    }, [options])

    // Keep the address bar in sync, so the current URL is always a shareable link.
    useEffect(() => {
        window.history.replaceState(window.history.state, '', buildShareUrl(window.location.href, seed))
    }, [seed])

    // Tick once per second while running.
    useEffect(() => {
        if (!running || seconds === null) return
        const id = window.setInterval(() => {
            setCountdown((c) => (c ? tick(c, seconds) : c))
        }, 1000)
        return () => window.clearInterval(id)
    }, [running, seconds])

    // Pick a new pose whenever a tick says time is up.
    useEffect(() => {
        if (countdown?.fired) setSeed(randomSeed())
    }, [countdown])

    // Clear the "Copied!" message after a moment.
    useEffect(() => {
        if (copyState === 'idle') return
        const id = window.setTimeout(() => setCopyState('idle'), 2000)
        return () => window.clearTimeout(id)
    }, [copyState])

    // Any manual pose change restarts the countdown while the timer is running.
    const showSeed = (next: number) => {
        setSeed(next)
        if (running && seconds !== null) setCountdown({ remaining: seconds, fired: false })
    }

    const randomize = () => showSeed(randomSeed())

    const loadSeed = (e: FormEvent) => {
        e.preventDefault()
        if (parsedSeed === null) return
        showSeed(parsedSeed)
        setSeedText('')
    }

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(buildShareUrl(window.location.href, seed))
            setCopyState('copied')
        } catch {
            setCopyState('failed')
        }
    }

    const toggle = () => {
        if (running) {
            setRunning(false)
            return
        }
        if (seconds === null) return
        setCountdown((c) => c ?? { remaining: seconds, fired: false })
        setRunning(true)
    }

    const onIntervalChange = (text: string) => {
        setIntervalText(text)
        setCountdown(null) // a new interval means a fresh countdown
    }

    const shown = countdown ? countdown.remaining : seconds
    const startLabel = countdown ? 'Resume' : 'Start'

    return (
        <div>
            <canvas ref={canvasRef} style={{ width: SIZE, height: SIZE }} />

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={randomize}>Randomize</button>
                <label>
                    Interval (seconds){' '}
                    <input
                        type="number"
                        min={MIN_SECONDS}
                        max={MAX_SECONDS}
                        step={1}
                        value={intervalText}
                        disabled={running}
                        onChange={(e) => onIntervalChange(e.target.value)}
                        style={{ width: '5rem' }}
                    />
                </label>
                <button onClick={toggle} disabled={!running && seconds === null}>
                    {running ? 'Pause' : startLabel}
                </button>
                <span role="timer">{shown === null ? '–' : `${shown}s`}</span>
            </div>
            {seconds === null && (
                <p>Enter a whole number of seconds from {MIN_SECONDS} to {MAX_SECONDS}.</p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.75rem' }}>
        <span>
          Seed: <strong>{seed}</strong>
        </span>
                <button onClick={copyLink}>Copy link</button>
                <span role="status" aria-live="polite">
          {copyState === 'copied' && 'Link copied!'}
                    {copyState === 'failed' && 'Could not copy. Copy the address bar instead.'}
        </span>
                <form onSubmit={loadSeed} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder={`Load seed (0–${MAX_SEED})`}
                        aria-label="Seed to load"
                        value={seedText}
                        onChange={(e) => setSeedText(e.target.value)}
                        style={{ width: '9rem' }}
                    />
                    <button type="submit" disabled={parsedSeed === null}>Load</button>
                </form>
            </div>
            {seedInvalid && <p>Seeds are whole numbers from 0 to {MAX_SEED}.</p>}
            <DisplayControls options={options} onChange={setOptions} />
        </div>
    )
}