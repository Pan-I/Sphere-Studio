import { describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'
import { nextTheme, parseTheme, resolveTheme, THEME_KEY } from './theme'

describe('parseTheme', () => {
    it('reads a saved Light or Dark', () => {
        expect(parseTheme('light')).toBe('light')
        expect(parseTheme('dark')).toBe('dark')
    })

    it('treats nothing saved, or anything odd, as Auto', () => {
        expect(parseTheme(null)).toBe('auto')
        expect(parseTheme('auto')).toBe('auto')
        expect(parseTheme('purple')).toBe('auto')
    })
})

describe('nextTheme', () => {
    it('steps Auto, Light, Dark and back round', () => {
        expect(nextTheme('auto')).toBe('light')
        expect(nextTheme('light')).toBe('dark')
        expect(nextTheme('dark')).toBe('auto')
    })
})

describe('resolveTheme', () => {
    it('follows the device on Auto', () => {
        expect(resolveTheme('auto', false)).toBe('light')
        expect(resolveTheme('auto', true)).toBe('dark')
    })

    it('ignores the device on Light or Dark', () => {
        expect(resolveTheme('light', true)).toBe('light')
        expect(resolveTheme('dark', false)).toBe('dark')
    })
})

describe('index.html', () => {
    it('reads the same storage key before the page draws', () => {
        expect(indexHtml).toContain(`localStorage.getItem('${THEME_KEY}')`)
    })
})
