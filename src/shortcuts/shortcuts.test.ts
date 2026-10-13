import { describe, expect, it, vi } from 'vitest'
import { createShortcutRegistry, isTypingTarget, keyLabel, type KeyPress } from './shortcuts'

const press = (key: string, extra: Partial<KeyPress> = {}): KeyPress => ({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    repeat: false,
    target: null,
    ...extra,
})

describe('shortcut registry', () => {
    it('runs the shortcut for a key, matching letters in either case', () => {
        const registry = createShortcutRegistry()
        const run = vi.fn()
        registry.add([{ key: 'p', description: 'Pause', run }])
        expect(registry.handle(press('p'))).toBe(true)
        expect(registry.handle(press('P'))).toBe(true)
        expect(run).toHaveBeenCalledTimes(2)
        expect(registry.handle(press('x'))).toBe(false)
    })

    it('leaves modified keys, held keys and typing alone', () => {
        const registry = createShortcutRegistry()
        const run = vi.fn()
        registry.add([{ key: 'p', description: 'Pause', run }])
        expect(registry.handle(press('p', { ctrlKey: true }))).toBe(false)
        expect(registry.handle(press('p', { metaKey: true }))).toBe(false)
        expect(registry.handle(press('p', { altKey: true }))).toBe(false)
        expect(registry.handle(press('p', { repeat: true }))).toBe(false)
        const input = { closest: (selector: string) => (selector.includes('input') ? {} : null) }
        expect(registry.handle(press('p', { target: input as unknown as EventTarget }))).toBe(false)
        expect(run).not.toHaveBeenCalled()
    })

    it('lets the newest group win a key, and gives it back when that group is removed', () => {
        const registry = createShortcutRegistry()
        const site = vi.fn()
        const tool = vi.fn()
        registry.add([{ key: 'f', description: 'Site', run: site }])
        const remove = registry.add([{ key: 'F', description: 'Tool', run: tool }])
        registry.handle(press('f'))
        expect(tool).toHaveBeenCalledTimes(1)
        expect(registry.list().map((s) => s.description)).toEqual(['Tool'])

        remove()
        registry.handle(press('f'))
        expect(site).toHaveBeenCalledTimes(1)
        expect(registry.list().map((s) => s.description)).toEqual(['Site'])
    })

    it('keeps the same list until something changes, and tells subscribers when it does', () => {
        const registry = createShortcutRegistry()
        const listener = vi.fn()
        const unsubscribe = registry.subscribe(listener)
        const before = registry.list()
        expect(registry.list()).toBe(before)

        const remove = registry.add([{ key: ' ', description: 'New pose', run: () => {} }])
        expect(listener).toHaveBeenCalledTimes(1)
        expect(registry.list()).not.toBe(before)

        unsubscribe()
        remove()
        expect(listener).toHaveBeenCalledTimes(1)
        expect(registry.list()).toEqual([])
    })
})

describe('isTypingTarget', () => {
    it('is false for no target or a non-element', () => {
        expect(isTypingTarget(null)).toBe(false)
        expect(isTypingTarget({} as EventTarget)).toBe(false)
    })
})

describe('keyLabel', () => {
    it('writes keys readably', () => {
        const run = () => {}
        expect(keyLabel({ key: ' ', description: '', run })).toBe('Space')
        expect(keyLabel({ key: 'p', description: '', run })).toBe('P')
        expect(keyLabel({ key: '?', description: '', run })).toBe('?')
        expect(keyLabel({ key: 'Escape', description: '', run, label: 'Esc' })).toBe('Esc')
    })
})
