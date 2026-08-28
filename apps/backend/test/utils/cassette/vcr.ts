import { Tape, Tapes } from './tape'

export type VcrMode = 'record' | 'replay'

const RECORD = 'record'

/**
 * A run records only when asked to; every other run replays, so a forgotten
 * environment variable costs a fast test rather than a live call.
 */
export function vcrMode(requested: string | undefined): VcrMode {
	return requested === RECORD ? 'record' : 'replay'
}

export type Recorded<T extends Tape> = ReturnType<T['recorded']>

export type Replayed<T extends Tape> = ReturnType<T['replayed']>

export type RecordedTapes<T extends Tapes> = {
	[K in keyof T]: Recorded<T[K]>
}

export type ReplayedTapes<T extends Tapes> = {
	[K in keyof T]: Replayed<T[K]>
}

/**
 * The tapes of a run, resolved to what its mode produced and keyed as they were
 * passed in.
 *
 * Discriminated on `mode`, so narrowing a run to one branch narrows every tape
 * in it at once: a test cannot reach for a live anvil's logs on the branch
 * where no process ever ran.
 */
export type Vcr<T extends Tapes> =
	| { mode: 'record'; tapes: RecordedTapes<T> }
	| { mode: 'replay'; tapes: ReplayedTapes<T> }
