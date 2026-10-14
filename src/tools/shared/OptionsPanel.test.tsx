// @vitest-environment jsdom
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { OptionsPanel } from './OptionsPanel'
import { colorModeField, lineWidthField, toggleField, type OptionFields } from './options'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

interface Opts {
    mode: 'color' | 'grayscale' | 'none'
    width: number
    outlines: boolean
}

const fields: OptionFields<Opts> = {
    mode: colorModeField('Mode', 'None'),
    width: lineWidthField(),
    outlines: {
        ...toggleField('Outlines', false),
        disabledWhen: (o) => o.mode === 'none',
        checkedWhenDisabled: true,
    },
}

let container: HTMLDivElement
let root: Root
let latest: Opts

function Harness() {
    const [options, setOptions] = useState<Opts>({ mode: 'color', width: 2, outlines: false })
    const onChange = (next: Opts) => {
        latest = next
        setOptions(next)
    }
    return <OptionsPanel fields={fields} options={options} onChange={onChange} />
}

const control = <E extends Element>(label: string, selector: string) => {
    const row = [...container.querySelectorAll('label')].find(
        (l) => l.querySelector('span')?.textContent === label,
    )
    return row!.querySelector<E & Element>(selector)!
}

// React tracks input values itself, so set them through the native setter to fire onChange.
function setValue(el: HTMLInputElement | HTMLSelectElement, value: string) {
    const proto = Object.getPrototypeOf(el) as object
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value)
    el.dispatchEvent(
        new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }),
    )
}

beforeEach(async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => root.render(<Harness />))
})
afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
})

describe('OptionsPanel', () => {
    it('renders one labelled control per field, in order', () => {
        const labels = [...container.querySelectorAll('label > span:first-child')].map(
            (s) => s.textContent,
        )
        expect(labels).toEqual(['Mode', 'Line thickness', 'Outlines'])
        expect(container.querySelector('legend')?.textContent).toBe('Display')
        expect(container.querySelector('output')?.textContent).toBe('2px')
    })

    it('updates each kind of option', async () => {
        await act(async () => setValue(control<HTMLInputElement>('Line thickness', 'input'), '6'))
        expect(latest.width).toBe(6)
        await act(async () => control<HTMLInputElement>('Outlines', 'input').click())
        expect(latest.outlines).toBe(true)
        await act(async () => setValue(control<HTMLSelectElement>('Mode', 'select'), 'grayscale'))
        expect(latest.mode).toBe('grayscale')
    })

    it('disables a field when its condition holds, showing a forced toggle as ticked', async () => {
        const outlines = control<HTMLInputElement>('Outlines', 'input')
        expect(outlines.disabled).toBe(false)
        expect(outlines.checked).toBe(false)
        await act(async () => setValue(control<HTMLSelectElement>('Mode', 'select'), 'none'))
        expect(outlines.disabled).toBe(true)
        expect(outlines.checked).toBe(true)
        expect(latest.outlines).toBe(false) // the saved choice is kept for when a fill comes back
    })

    it('resets every option to its default, and is greyed out while already there', async () => {
        const reset = [...container.querySelectorAll('button')].find(
            (b) => b.textContent === 'Reset to defaults',
        )!
        expect(reset.disabled).toBe(true)
        await act(async () => setValue(control<HTMLSelectElement>('Mode', 'select'), 'none'))
        await act(async () => setValue(control<HTMLInputElement>('Line thickness', 'input'), '6'))
        expect(reset.disabled).toBe(false)
        await act(async () => reset.click())
        expect(latest).toEqual({ mode: 'color', width: 2, outlines: false })
        expect(reset.disabled).toBe(true)
    })
})
