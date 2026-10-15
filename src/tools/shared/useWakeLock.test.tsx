// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWakeLock } from './useWakeLock'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function Probe({ active }: { active: boolean }) {
    useWakeLock(active)
    return null
}

let root: Root
let held: number
const request = vi.fn(async () => {
    held++
    return { release: vi.fn(async () => void held--) } as unknown as WakeLockSentinel
})

const render = async (active: boolean) => {
    await act(async () => root.render(<Probe active={active} />))
}

beforeEach(() => {
    held = 0
    request.mockClear()
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } })
    root = createRoot(document.createElement('div'))
})
afterEach(async () => {
    await act(async () => root.unmount())
    delete (navigator as { wakeLock?: unknown }).wakeLock
})

describe('useWakeLock', () => {
    it('keeps the screen on only while active', async () => {
        await render(false)
        expect(request).not.toHaveBeenCalled()

        await render(true)
        expect(request).toHaveBeenCalledWith('screen')
        expect(held).toBe(1)

        await render(false)
        expect(held).toBe(0)
    })

    it('takes the lock again when you come back to the tab', async () => {
        await render(true)
        await act(async () => document.dispatchEvent(new Event('visibilitychange')))
        expect(request).toHaveBeenCalledTimes(2)
        expect(held).toBe(1) // the old lock was let go
    })

    it('does nothing where the browser has no wake lock', async () => {
        delete (navigator as { wakeLock?: unknown }).wakeLock
        await render(true)
        expect(request).not.toHaveBeenCalled()
    })
})
