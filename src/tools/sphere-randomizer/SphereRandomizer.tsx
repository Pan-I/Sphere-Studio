import { useEffect, useRef, useState } from 'react'
import { randomQuat, type Quat } from '../../math/quat'
import { drawSphere } from './drawSphere'
import { MAX_SECONDS, MIN_SECONDS, parseInterval, tick, type Countdown } from './countdown'

const SIZE = 480

export function SphereRandomizer() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [q, setQ] = useState<Quat>(() => randomQuat(Math.random))
    const [intervalText, setIntervalText] = useState('30')
    const [running, setRunning] = useState(false)
    const [countdown, setCountdown] = useState<Countdown | null>(null)

    const seconds = parseInterval(intervalText)

    // Draw whenever the orientation changes.
    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return
        const dpr = window.devicePixelRatio || 1
        canvas.width = SIZE * dpr
        canvas.height = SIZE * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        drawSphere(ctx, SIZE, q)
    }, [q])

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
        if (countdown?.fired) setQ(randomQuat(Math.random))
    }, [countdown])

    const randomize = () => {
        setQ(randomQuat(Math.random))
        if (running && seconds !== null) setCountdown({ remaining: seconds, fired: false })
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
        </div>
    )
}