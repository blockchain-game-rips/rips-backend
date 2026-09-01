import { SyncProgress } from '../value-objects/sync-progress'

const FIRST_RIP_ID = 1

/**
 * Rip ids start at 1 and are handed out one at a time, so every id between 1
 * and the highest synced one that is missing from the input is a rip the
 * backend still owes work.
 */
export function resolveSyncProgress(syncedIds: number[]): SyncProgress {
	if (syncedIds.length === 0) return { highest: 0, holeIds: [] }

	const synced = new Set(syncedIds)
	const highest = Math.max(...syncedIds)

	const holeIds: number[] = []

	for (let id = FIRST_RIP_ID; id < highest; id++) {
		if (!synced.has(id)) holeIds.push(id)
	}

	return { highest, holeIds }
}
