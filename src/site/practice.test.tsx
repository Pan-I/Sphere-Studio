// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { PRACTICE_KEY } from '../practice/playlist'
import * as chime from '../tools/shared/chime'

// Sound is checked by what gets called; chime.test.ts covers the Web Audio part.
vi.mock('../tools/shared/chime', async (importOriginal) => ({
    ...(await importOriginal<typeof chime>()),
    playChime: vi.fn(),
    unlockAudio: vi.fn(),
}))
const play = vi.mocked(chime.playChime)
const unlock = vi.mocked(chime.unlockAudio)

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

const mount = async (url: string) => {
    window.history.replaceState(null, '', url)
    await act(async () => {
        root.render(
            <BrowserRouter>
                <App />
            </BrowserRouter>,
        )
    })
}
const press = async (key: string) => {
    await act(async () => {
        document.body.dispatchEvent(
            new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
        )
    })
}
const button = (text: string) =>
    [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === text)
const click = async (text: string) => {
    const b = button(text)
    if (!b) throw new Error(`No button "${text}"`)
    await act(async () => b.click())
}
const labelled = <T extends Element>(label: string) =>
    container.querySelector<T & Element>(`[aria-label="${label}"]`)!
const type = async (label: string, text: string) => {
    const input = labelled<HTMLInputElement>(label)
    await act(async () => {
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
        set.call(input, text)
        input.dispatchEvent(new Event('input', { bubbles: true }))
    })
}
const choose = async (label: string, value: string) => {
    const select = labelled<HTMLSelectElement>(label)
    await act(async () => {
        select.value = value
        select.dispatchEvent(new Event('change', { bubbles: true }))
    })
}
const seconds = async (n: number) => {
    await act(async () => {
        vi.advanceTimersByTime(n * 1000)
    })
}
const heading = () => container.querySelector('h1')?.textContent
const progress = () => container.querySelector('.practice-bar-now')?.textContent
const total = () => container.querySelector('.practice-total')?.textContent
const seedShown = () => Number(container.querySelector('.session-seed strong')!.textContent)
const save = (steps: { tool: string; poses: number; seconds: number }[]) =>
    window.localStorage.setItem(PRACTICE_KEY, JSON.stringify(steps))

beforeEach(() => {
    vi.useFakeTimers()
    // jsdom has no canvas; this keeps its "not implemented" warnings out of the test output.
    HTMLCanvasElement.prototype.getContext = (() =>
        null) as typeof HTMLCanvasElement.prototype.getContext
    window.scrollTo = () => {}
    window.localStorage.clear()
    play.mockClear()
    unlock.mockClear()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
})
afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.useRealTimers()
})

describe('finding it', () => {
    it('has a Practice link in the header and on the home page', async () => {
        await mount('/')
        const links = [...container.querySelectorAll('a[href="/practice"]')]
        expect(links.some((a) => a.closest('.site-nav'))).toBe(true)
        expect(links.some((a) => a.closest('.home-practice'))).toBe(true)
        await act(async () => (links[0] as HTMLAnchorElement).click())
        expect(heading()).toBe('Practice session')
        expect(document.title).toContain('Practice session')
    })
})

describe('putting a session together', () => {
    it('starts with 5 spheres at 60s, then 5 trios at 90s', async () => {
        await mount('/practice')
        expect(labelled<HTMLSelectElement>('Step 1 tool').value).toBe('sphere-randomizer')
        expect(labelled<HTMLSelectElement>('Step 2 tool').value).toBe('circle-trio-1')
        expect(total()).toBe('10 poses, 12 min 30 s')
    })

    it("doesn't offer Value Study", async () => {
        await mount('/practice')
        const options = [...labelled<HTMLSelectElement>('Step 1 tool').options].map((o) => o.value)
        expect(options).toContain('form-combo')
        expect(options).not.toContain('value-study')
    })

    it('saves changes and brings them back next visit', async () => {
        await mount('/practice')
        await choose('Step 2 tool', 'box-randomizer')
        await type('Step 2 poses', '3')
        await act(async () => root.unmount())
        root = createRoot(container)
        await mount('/practice')
        expect(labelled<HTMLSelectElement>('Step 2 tool').value).toBe('box-randomizer')
        expect(labelled<HTMLInputElement>('Step 2 poses').value).toBe('3')
        expect(total()).toBe('8 poses, 9 min 30 s')
    })

    it("won't start while a number is out of range", async () => {
        await mount('/practice')
        await type('Step 1 seconds each', '0')
        expect(button('Start session')!.disabled).toBe(true)
        expect(container.querySelector('.practice-step-error')).not.toBeNull()
        await type('Step 1 seconds each', '45')
        expect(button('Start session')!.disabled).toBe(false)
    })

    it('adds, moves and removes steps, and loads presets', async () => {
        await mount('/practice')
        await click('+ Add a step')
        expect(container.querySelectorAll('.practice-step')).toHaveLength(3)
        await click('Forms 24 min')
        expect(container.querySelectorAll('.practice-step')).toHaveLength(4)
        expect(labelled<HTMLSelectElement>('Step 1 tool').value).toBe('box-randomizer')
        await act(async () => labelled<HTMLButtonElement>('Move step 1 down').click())
        expect(labelled<HTMLSelectElement>('Step 1 tool').value).toBe('cylinder-randomizer')
        expect(labelled<HTMLSelectElement>('Step 2 tool').value).toBe('box-randomizer')
        await act(async () => labelled<HTMLButtonElement>('Remove step 1').click())
        expect(container.querySelectorAll('.practice-step')).toHaveLength(3)
        expect(labelled<HTMLSelectElement>('Step 1 tool').value).toBe('box-randomizer')
    })
})

describe('running a session', () => {
    it('runs each step on the timer, chimes, and ends with what you drew', async () => {
        save([
            { tool: 'sphere-randomizer', poses: 2, seconds: 3 },
            { tool: 'circle-trio-1', poses: 1, seconds: 2 },
        ])
        await mount('/practice')
        await click('Start session')
        expect(unlock).toHaveBeenCalled()
        expect(heading()).toBe('Sphere Randomizer')
        expect(progress()).toBe('Step 1 of 2: Sphere Randomizer, pose 1 of 2')
        // The timer is already running at the step's interval, which can't be changed here.
        expect(button('Pause')).toBeDefined()
        expect(container.querySelector('[role="timer"]')?.textContent).toBe('3s')
        expect(container.querySelector<HTMLInputElement>('input[type="number"]')!.disabled).toBe(
            true,
        )
        // The address bar stays on the practice page.
        expect(window.location.pathname).toBe('/practice')
        expect(window.location.search).toBe('')

        const first = seedShown()
        await seconds(3)
        expect(play).toHaveBeenCalledTimes(1)
        expect(progress()).toBe('Step 1 of 2: Sphere Randomizer, pose 2 of 2')
        const second = seedShown()
        expect(second).not.toBe(first)

        await seconds(3)
        expect(play).toHaveBeenCalledTimes(2)
        expect(heading()).toBe('Circle Trio 1')
        expect(progress()).toBe('Step 2 of 2: Circle Trio 1, pose 1 of 1')
        expect(container.querySelector('[role="timer"]')?.textContent).toBe('2s')
        const third = seedShown()

        await seconds(2)
        expect(play).toHaveBeenCalledTimes(3)
        expect(heading()).toBe('Session complete')
        expect(container.textContent).toContain('You drew 3 poses in 8 s.')
        const links = [...container.querySelectorAll('.practice-poses a')].map((a) =>
            a.getAttribute('href'),
        )
        expect(links).toEqual([
            `/sphere-randomizer?seed=${first}`,
            `/sphere-randomizer?seed=${second}`,
            `/circle-trio-1?seed=${third}`,
        ])
        expect(window.location.search).toBe('')
    })

    it('starts the same tool afresh when two steps in a row use it', async () => {
        save([
            { tool: 'box-randomizer', poses: 1, seconds: 3 },
            { tool: 'box-randomizer', poses: 1, seconds: 5 },
        ])
        await mount('/practice')
        await click('Start session')
        await seconds(3)
        expect(progress()).toBe('Step 2 of 2: Box Randomizer, pose 1 of 1')
        expect(container.querySelector('[role="timer"]')?.textContent).toBe('5s')
        expect(button('Pause')).toBeDefined()
    })

    it("doesn't count a pose you skip with Randomize", async () => {
        save([{ tool: 'sphere-randomizer', poses: 2, seconds: 3 }])
        await mount('/practice')
        await click('Start session')
        await seconds(2)
        await click('Randomize')
        expect(progress()).toContain('pose 1 of 2')
        expect(container.querySelector('[role="timer"]')?.textContent).toBe('3s')
    })

    it('holds while paused', async () => {
        save([{ tool: 'sphere-randomizer', poses: 2, seconds: 3 }])
        await mount('/practice')
        await click('Start session')
        await press('p')
        await seconds(10)
        expect(progress()).toContain('pose 1 of 2')
        await press('p')
        await seconds(3)
        expect(progress()).toContain('pose 2 of 2')
    })

    it('skips to the next step with the button or N, and lists N with the shortcuts', async () => {
        save([
            { tool: 'sphere-randomizer', poses: 5, seconds: 60 },
            { tool: 'cone-randomizer', poses: 5, seconds: 60 },
            { tool: 'form-combo', poses: 5, seconds: 60 },
        ])
        await mount('/practice')
        await click('Start session')
        await click('Next step')
        expect(heading()).toBe('Cone Randomizer')
        await press('n')
        expect(heading()).toBe('Form Combo')
        expect(button('Finish')).toBeDefined()
        await press('?')
        expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
            'Next step of the practice session',
        )
        await press('Escape')
        await press('n')
        expect(heading()).toBe('Session complete')
        expect(container.textContent).toContain('No poses finished this time.')
    })

    it('ends early with what was drawn so far, and goes again', async () => {
        save([
            { tool: 'sphere-randomizer', poses: 3, seconds: 2 },
            { tool: 'circle-trio-2', poses: 3, seconds: 2 },
        ])
        await mount('/practice')
        await click('Start session')
        await seconds(2)
        await click('End session')
        expect(heading()).toBe('Session ended')
        expect(container.textContent).toContain('You drew 1 pose in 2 s.')
        expect(container.querySelectorAll('.practice-poses li')).toHaveLength(1)

        await click('Start over')
        expect(progress()).toBe('Step 1 of 2: Sphere Randomizer, pose 1 of 3')
        await click('End session')
        await click('Change the session')
        expect(heading()).toBe('Practice session')
    })

    it("copies a link to the pose on its tool's own page", async () => {
        const writeText = vi.fn(() => Promise.resolve())
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
        save([{ tool: 'cylinder-randomizer', poses: 2, seconds: 30 }])
        await mount('/practice')
        await click('Start session')
        await click('Copy link')
        expect(writeText).toHaveBeenCalledWith(
            `${window.location.origin}/cylinder-randomizer?seed=${seedShown()}`,
        )
    })

    it('keeps its progress in view in full screen', async () => {
        save([{ tool: 'sphere-randomizer', poses: 2, seconds: 30 }])
        await mount('/practice')
        await click('Start session')
        const bar = container.querySelector('.practice-bar')!
        expect(bar.getAttribute('data-focus')).toBe('show')
        expect(bar.parentElement?.classList.contains('tool-frame')).toBe(true)
        expect(button('End session')!.closest('[data-focus="hide"]')).not.toBeNull()
    })
})
