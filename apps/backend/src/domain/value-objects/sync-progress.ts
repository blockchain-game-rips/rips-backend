/**
 * What the backend has yet to synchronise: the highest rip id already synced,
 * plus every id below it that was skipped. Rips do not settle in id order, so
 * the highest id alone would strand the holes forever.
 */
export type SyncProgress = {
	highest: number
	holeIds: number[]
}
