// src/tools/sphere-randomizer/SphereRandomizer.tsx
import { useEffect, useRef, useState } from 'react'
import { randomQuat, type Quat } from '../../math/quat'
import { drawSphere } from './drawSphere'

const SIZE = 480

export function SphereRandomizer() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [q, setQ] = useState<Quat>(() => randomQuat(Math.random))

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return
        const dpr = window.devicePixelRatio || 1 // keeps lines crisp on retina screens
        canvas.width = SIZE * dpr
        canvas.height = SIZE * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        drawSphere(ctx, SIZE, q)
    }, [q])

    return (
        <div>
            <canvas ref={canvasRef} style={{ width: SIZE, height: SIZE }} />
            <button onClick={() => setQ(randomQuat(Math.random))}>Randomize</button>
        </div>
    )
}