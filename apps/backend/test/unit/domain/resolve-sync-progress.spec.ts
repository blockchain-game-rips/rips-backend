import { resolveSyncProgress } from '../../../src/domain/services/sync-progress-utils'

describe('resolveSyncProgress', () => {
	it('reports nothing synced for an empty input', () => {
		expect(resolveSyncProgress([])).toEqual({ highest: 0, holeIds: [] })
	})

	it('finds no holes in an unbroken run from 1', () => {
		expect(resolveSyncProgress([1, 2, 3])).toEqual({
			highest: 3,
			holeIds: [],
		})
	})

	it('finds an id skipped in the middle', () => {
		expect(resolveSyncProgress([1, 3])).toEqual({
			highest: 3,
			holeIds: [2],
		})
	})

	it('treats ids below the lowest synced one as holes', () => {
		expect(resolveSyncProgress([7, 8, 9])).toEqual({
			highest: 9,
			holeIds: [1, 2, 3, 4, 5, 6],
		})
	})
})
