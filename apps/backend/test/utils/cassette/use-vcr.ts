import nock from 'nock'
import { basename, dirname, join, relative } from 'node:path'
import { TestContext } from 'vitest'
import { getCurrentSuite } from 'vitest/suite'
import { useAcceleratedTime } from './accelerated-time'
import { decompressResponse } from './decompress'
import { sectionNameFrom } from './section-name'
import { isDefinition, Tape, Tapes } from './tape'
import { readSection, writeSection } from './tape-file'
import { RecordedTapes, ReplayedTapes, Vcr, VcrMode, vcrMode } from './vcr'

/**
 * Serves this spec's outgoing HTTP from a committed recording instead of the
 * network, and hands back the tapes it was given, resolved to whichever mode
 * the run is in.
 *
 * The tape file is named after the spec file and the section inside it after
 * the describe block, so there is nothing to declare and nothing to keep in
 * sync. A tape not passed in here is not recorded and not matched: leaving one
 * out is how a test opts its traffic out.
 */
export function useVcr<T extends Tapes>(tapes: T): Vcr<T> {
	const specPath = currentSpecPath()
	const path = tapePathFor(specPath)
	const section = sectionNameFrom(currentSuiteName())
	const mode = vcrMode(process.env.VCR)

	const entries = Object.values(tapes)

	if (mode === 'replay') {
		useAcceleratedTime()
	}

	let failed = false

	beforeAll(async () => {
		if (mode === 'record') {
			await Promise.all(entries.map((tape) => tape.record()))

			startRecording()

			return
		}

		replay(path, section, specPath)
	})

	afterEach((context) => {
		if (!didPass(context)) {
			failed = true
		}
	})

	afterAll(async () => {
		// A failed run recorded an exchange that ends in a failure, and writing
		// it would replace a working tape with one that reproduces the break.
		if (mode === 'record' && !failed) {
			saveRecording(path, section, entries)
		}

		nock.cleanAll()
		nock.restore()

		await Promise.all(entries.map((tape) => tape.stop()))
	})

	return resolve(tapes, mode)
}

/**
 * Resolves each tape to what its mode produced, keeping the keys it was passed
 * under.
 *
 * Each branch names its mode as a literal, which is what lets the two resolve
 * to different tape shapes under one set of keys.
 */
function resolve<T extends Tapes>(tapes: T, mode: VcrMode): Vcr<T> {
	if (mode === 'record') {
		return {
			mode: 'record',
			tapes: mapTapes<T, RecordedTapes<T>>(tapes, (tape) =>
				tape.recorded(),
			),
		}
	}

	return {
		mode: 'replay',
		tapes: mapTapes<T, ReplayedTapes<T>>(tapes, (tape) => tape.replayed()),
	}
}

/**
 * Maps every tape through `resolveOne` under the keys it came in with.
 *
 * TypeScript cannot follow a mapped type through a loop over a variable key —
 * it widens each element to the union of all of them — so the result shape is
 * asserted once, here, rather than at each of the two call sites. What the
 * assertion claims is checked at runtime below: every key was resolved.
 */
function mapTapes<T extends Tapes, R extends Record<keyof T, unknown>>(
	tapes: T,
	resolveOne: (tape: Tape) => unknown,
): R {
	const resolved: Record<string, unknown> = {}

	for (const key of Object.keys(tapes)) {
		resolved[key] = resolveOne(tapes[key])
	}

	const unresolved = Object.keys(tapes).filter((key) => !(key in resolved))

	if (unresolved.length > 0) {
		throw new Error(`Tapes left unresolved: ${unresolved.join(', ')}`)
	}

	return resolved as R
}

const PASSED = 'pass'

function didPass({ task }: TestContext): boolean {
	return task.result?.state === PASSED
}

const CASSETTES_DIR = '__cassettes__'

export function tapePathFor(specPath: string): string {
	const name = basename(specPath).replace(/\.ts$/, '.json')

	return join(dirname(specPath), CASSETTES_DIR, name)
}

function currentSpecPath(): string {
	const { testPath } = expect.getState()

	if (!testPath) {
		throw new Error(
			'useVcr() could not determine the current spec file. It must be called from a spec, at describe-assembly time.',
		)
	}

	return testPath
}

function startRecording(): void {
	nock.recorder.rec({
		dont_print: true,
		output_objects: true,
		enable_reqheaders_recording: false,
	})
}

function saveRecording(path: string, section: string, tapes: Tape[]): void {
	const recorded = nock.recorder
		.play()
		.filter(isDefinition)
		.map((definition) => normalizeThrough(tapes, definition))
		.map(decompressResponse)
		.filter((definition) => belongsOnTape(tapes, definition))

	nock.recorder.clear()

	// A run that recorded nothing leaves the tape alone: a run that died before
	// doing any work must not overwrite a good recording with an empty one.
	if (recorded.length === 0) {
		return
	}

	// The section is rewritten wholesale rather than appended to, so a request
	// the code no longer makes drops off the tape by itself. Other sections are
	// left as they were found, which is what makes recording a single test with
	// `.only` safe.
	writeSection(path, section, recorded)
}

/**
 * Every tape gets a look, since only the one that owns an interaction knows
 * what about it drifts between runs; the rest hand it back untouched.
 */
function normalizeThrough(
	tapes: Tape[],
	definition: nock.Definition,
): nock.Definition {
	return tapes.reduce(
		(normalized, tape) => tape.normalize(normalized),
		definition,
	)
}

function belongsOnTape(tapes: Tape[], definition: nock.Definition): boolean {
	return tapes.some((tape) => tape.owns(definition))
}

function replay(path: string, section: string, specPath: string): void {
	const recorded = readSection(path, section)

	if (!recorded) {
		throw new Error(missingTapeMessage(path, section, specPath))
	}

	// define() only registers interceptors; it never reinstates the http patch
	// a previous restore() took off, and requests would slip past to the real
	// network without one.
	if (!nock.isActive()) {
		nock.activate()
	}

	nock.define(recorded)
}

function missingTapeMessage(
	path: string,
	section: string,
	specPath: string,
): string {
	const specName = basename(specPath, '.spec.ts')

	return [
		`No recording of "${section}" in ${relative(process.cwd(), path)}.`,
		`Record one with: VCR=record yarn test:integration ${specName}`,
	].join('\n')
}

function currentSuiteName(): string {
	return getCurrentSuite().suite?.fullName ?? ''
}
