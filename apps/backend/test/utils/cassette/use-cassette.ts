import { ParamsUseAnvil, useAnvil } from '@rips/test-harness'
import nock from 'nock'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import { TestContext } from 'vitest'
import { useAcceleratedTime } from './accelerated-time'
import { decompressResponse } from './decompress'
import { isRecordedHost } from './hosts'
import { isRewrittenScope, rewriteScope, ScopeRewrites } from './scope-rewrites'
import {
	liveAnvil,
	replayedAnvil,
	replayedAnvilUrl,
	TapedAnvil,
	withTapedTraces,
} from './taped-anvil'

export type Cassette = {
	/**
	 * Recording boots a real anvil; replay serves its traffic off the tape and
	 * boots nothing. Which one happened is the cassette's business, not the
	 * spec's, so both return the same shape.
	 */
	useAnvil(params: ParamsUseAnvil[]): TapedAnvil[]

	withTraces<T>(anvil: TapedAnvil, run: () => Promise<T>): Promise<T>
}

/**
 * Serves this spec's outgoing HTTP from a committed recording instead of the
 * network. The tape is named after the spec file, so there is nothing to
 * declare and nothing to keep in sync.
 */
export function useCassette(): Cassette {
	const specPath = currentSpecPath()
	const path = cassettePathFor(specPath)
	const recording = process.env.VCR === 'record'

	const rewrites = new Map<string, string>()

	if (!recording) {
		useAcceleratedTime()
	}

	let failed = false

	beforeAll(() => {
		if (recording) {
			startRecording()

			return
		}

		replay(path, specPath)
	})

	afterEach((context) => {
		if (!didPass(context)) {
			failed = true
		}
	})

	afterAll(() => {
		// A failed run recorded an exchange that ends in a failure, and writing
		// it would replace a working tape with one that reproduces the break.
		if (recording && !failed) {
			saveRecording(path, rewrites)
		}

		nock.cleanAll()
		nock.restore()
	})

	return {
		useAnvil(params) {
			if (!recording) {
				return params.map(replayedAnvil)
			}

			const anvils = useAnvil(params).anvils.map(liveAnvil)

			// Captured while the processes are still up: reading a port back in
			// afterAll would depend on stop() leaving it in place.
			beforeAll(() => {
				params.forEach(({ chainId }, index) => {
					const anvil = anvils[index]

					if (anvil) {
						rewrites.set(anvil.rpcUrl, replayedAnvilUrl(chainId))
					}
				})
			})

			return anvils
		},

		withTraces(anvil, run) {
			return withTapedTraces(anvil, noTracesReason(path), run)
		},
	}
}

const PASSED = 'pass'

function didPass({ task }: TestContext): boolean {
	return task.result?.state === PASSED
}

const CASSETTES_DIR = '__cassettes__'

export function cassettePathFor(specPath: string): string {
	const name = basename(specPath).replace(/\.ts$/, '.json')

	return join(dirname(specPath), CASSETTES_DIR, name)
}

function currentSpecPath(): string {
	const { testPath } = expect.getState()

	if (!testPath) {
		throw new Error(
			'useCassette() could not determine the current spec file. It must be called from a spec, at describe-assembly time.',
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

function saveRecording(path: string, rewrites: ScopeRewrites): void {
	const recorded = nock.recorder
		.play()
		.filter(isDefinition)
		.map((definition) => rewriteScope(definition, rewrites))
		.map(decompressResponse)
		.filter((definition) => belongsOnTape(definition, rewrites))

	nock.recorder.clear()

	// A run that recorded nothing leaves the tape alone: a run that died before
	// doing any work must not overwrite a good recording with an empty one.
	if (recorded.length === 0) {
		return
	}

	mkdirSync(dirname(path), { recursive: true })

	// A recording run rewrites the tape wholesale rather than appending, so a
	// request the code no longer makes drops off the tape by itself.
	writeFileSync(path, `${JSON.stringify(recorded, null, JSON_INDENT)}\n`)
}

const JSON_INDENT = 2

function belongsOnTape(
	definition: nock.Definition,
	rewrites: ScopeRewrites,
): boolean {
	const { hostname } = new URL(String(definition.scope))

	return isRecordedHost(hostname) || isRewrittenScope(definition, rewrites)
}

function isDefinition(candidate: unknown): candidate is nock.Definition {
	return (
		typeof candidate === 'object' &&
		candidate !== null &&
		'scope' in candidate &&
		typeof candidate.scope === 'string'
	)
}

function replay(path: string, specPath: string): void {
	if (!existsSync(path)) {
		throw new Error(missingCassetteMessage(path, specPath))
	}

	// define() only registers interceptors; it never reinstates the http patch
	// a previous restore() took off, and requests would slip past to the real
	// network without one.
	if (!nock.isActive()) {
		nock.activate()
	}

	nock.define(readTape(path))
}

function readTape(path: string): nock.Definition[] {
	const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))

	if (!Array.isArray(parsed) || !parsed.every(isDefinition)) {
		throw new Error(
			`Cassette ${relative(process.cwd(), path)} is not a list of recorded interactions.`,
		)
	}

	return parsed
}

function missingCassetteMessage(path: string, specPath: string): string {
	const specName = basename(specPath, '.spec.ts')

	return [
		`No cassette at ${relative(process.cwd(), path)}.`,
		`Record one with: VCR=record yarn test:integration ${specName}`,
	].join('\n')
}

function noTracesReason(path: string): string {
	return `No anvil traces: this run replayed ${relative(process.cwd(), path)}, so anvil never started.`
}
