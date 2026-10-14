// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
    FAVORITES_LIMIT,
    favoritesKey,
    loadFavorites,
    parseFavorites,
    saveFavorites,
    toggleFavorite,
} from './favorites'

describe('parseFavorites', () => {
    it('reads a stored list of seeds', () => {
        expect(parseFavorites('[3, 48213, 0]')).toEqual([3, 48213, 0])
    })

    it('is empty for nothing stored or anything that is not a list', () => {
        expect(parseFavorites(null)).toEqual([])
        expect(parseFavorites('')).toEqual([])
        expect(parseFavorites('not json')).toEqual([])
        expect(parseFavorites('{"seed": 3}')).toEqual([])
        expect(parseFavorites('42')).toEqual([])
    })

    it('drops anything that is not a valid seed, and repeats', () => {
        expect(parseFavorites('[5, "7", -1, 1.5, 1000000, null, 5, 999999]')).toEqual([5, 999999])
    })

    it('keeps at most the limit', () => {
        const many = Array.from({ length: FAVORITES_LIMIT + 5 }, (_, i) => i)
        expect(parseFavorites(JSON.stringify(many))).toHaveLength(FAVORITES_LIMIT)
    })
})

describe('toggleFavorite', () => {
    it('puts a new favorite first', () => {
        expect(toggleFavorite([1, 2], 3)).toEqual([3, 1, 2])
    })

    it('removes a seed that is already a favorite', () => {
        expect(toggleFavorite([1, 2, 3], 2)).toEqual([1, 3])
    })

    it('drops the oldest when full', () => {
        expect(toggleFavorite([3, 2, 1], 4, 3)).toEqual([4, 3, 2])
    })
})

describe('loadFavorites and saveFavorites', () => {
    beforeEach(() => window.localStorage.clear())

    it('round-trips per tool', () => {
        saveFavorites('box-randomizer', [7, 8])
        expect(loadFavorites('box-randomizer')).toEqual([7, 8])
        expect(loadFavorites('cone-randomizer')).toEqual([])
    })

    it('stores nothing once the list is empty', () => {
        saveFavorites('box-randomizer', [7])
        saveFavorites('box-randomizer', [])
        expect(window.localStorage.getItem(favoritesKey('box-randomizer'))).toBeNull()
    })
})
