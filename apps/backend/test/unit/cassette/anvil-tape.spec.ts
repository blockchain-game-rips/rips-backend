import nock from 'nock'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { anvilTape } from '../../utils/cassette/anvil-tape'

const BASE_CHAIN_ID = 8453
const ARBITRUM_CHAIN_ID = 42161
const ANVIL_PORT = 45003

const SOME_STATE = '{"accounts":{}}'
const ANOTHER_STATE = '{"accounts":{"0x1":{}}}'

const FINGERPRINT_LENGTH = 6

function stateFile(contents: string): string {
	const path = join(mkdtempSync(join(tmpdir(), 'anvil-state-')), 'state.json')

	writeFileSync(path, contents)

	return path
}

describe('anvil tape', () => {
	it('keeps two chains apart, since de-bridge tapes both at once', () => {
		const base = anvilTape({ chainId: BASE_CHAIN_ID })
		const arbitrum = anvilTape({ chainId: ARBITRUM_CHAIN_ID })

		expect(base.replayed().rpcUrl).not.toBe(arbitrum.replayed().rpcUrl)
	})

	it('replays against a stable host rather than a random port', () => {
		expect(anvilTape({ chainId: BASE_CHAIN_ID }).replayed().rpcUrl).toBe(
			`http://anvil-${BASE_CHAIN_ID}`,
		)
	})

	it('resolves a recording url only once anvil has bound a port', () => {
		const tape = anvilTape({ chainId: BASE_CHAIN_ID })
		const recorded = tape.recorded()

		expect(() => recorded.rpcUrl).toThrow('Anvil not started')

		vi.spyOn(tape.anvil, 'port', 'get').mockReturnValue(ANVIL_PORT)

		expect(recorded.rpcUrl).toBe(`http://127.0.0.1:${ANVIL_PORT}`)
	})

	it('rewrites the port it recorded on into the host it replays against', () => {
		const tape = anvilTape({ chainId: BASE_CHAIN_ID })

		vi.spyOn(tape.anvil, 'port', 'get').mockReturnValue(ANVIL_PORT)

		const rewritten = tape.normalize({
			scope: `http://127.0.0.1:${ANVIL_PORT}`,
			path: '/',
			method: 'POST',
		})

		expect(String(rewritten.scope)).toBe(`http://anvil-${BASE_CHAIN_ID}:80`)
	})

	it('leaves an interaction that is not its own alone', () => {
		const tape = anvilTape({ chainId: BASE_CHAIN_ID })

		vi.spyOn(tape.anvil, 'port', 'get').mockReturnValue(ANVIL_PORT)

		const untouched: nock.Definition = {
			scope: 'https://li.quest:443',
			path: '/v1/quote',
			method: 'GET',
		}

		expect(tape.normalize(untouched)).toEqual(untouched)
	})
})

describe('anvil tape state fingerprint', () => {
	// The tape matches eth_call by calldata, which does not change when the
	// contract behind it does. Without the state in the url, an edited
	// contract replays the answer the old one gave.
	it('carries the state it was loaded with in the url it replays against', () => {
		const tape = anvilTape({
			chainId: BASE_CHAIN_ID,
			pathToState: stateFile(SOME_STATE),
		})

		expect(tape.replayed().rpcUrl).toMatch(
			new RegExp(
				`^http://anvil-${BASE_CHAIN_ID}\\?state=[0-9a-f]{${FINGERPRINT_LENGTH}}$`,
			),
		)
	})

	it('replays against a different url once the state changes', () => {
		const before = anvilTape({
			chainId: BASE_CHAIN_ID,
			pathToState: stateFile(SOME_STATE),
		})

		const after = anvilTape({
			chainId: BASE_CHAIN_ID,
			pathToState: stateFile(ANOTHER_STATE),
		})

		expect(before.replayed().rpcUrl).not.toBe(after.replayed().rpcUrl)
	})

	it('replays against the same url for the same state', () => {
		const first = anvilTape({
			chainId: BASE_CHAIN_ID,
			pathToState: stateFile(SOME_STATE),
		})

		const second = anvilTape({
			chainId: BASE_CHAIN_ID,
			pathToState: stateFile(SOME_STATE),
		})

		expect(first.replayed().rpcUrl).toBe(second.replayed().rpcUrl)
	})

	// A bare fork has no state file to pin, so there is nothing to check.
	it('leaves the url bare when there is no state to pin', () => {
		expect(anvilTape({ chainId: BASE_CHAIN_ID }).replayed().rpcUrl).toBe(
			`http://anvil-${BASE_CHAIN_ID}`,
		)
	})

	it('pins the state on the path it records against', () => {
		const tape = anvilTape({
			chainId: BASE_CHAIN_ID,
			pathToState: stateFile(SOME_STATE),
		})

		vi.spyOn(tape.anvil, 'port', 'get').mockReturnValue(ANVIL_PORT)

		const rewritten = tape.normalize({
			scope: `http://127.0.0.1:${ANVIL_PORT}`,
			path: '/',
			method: 'POST',
		})

		expect(String(rewritten.scope)).toBe(`http://anvil-${BASE_CHAIN_ID}:80`)
		expect(String(rewritten.path)).toMatch(/^\/\?state=[0-9a-f]+$/)
	})

	it('owns the normalized form it writes', () => {
		const tape = anvilTape({
			chainId: BASE_CHAIN_ID,
			pathToState: stateFile(SOME_STATE),
		})

		vi.spyOn(tape.anvil, 'port', 'get').mockReturnValue(ANVIL_PORT)

		const rewritten = tape.normalize({
			scope: `http://127.0.0.1:${ANVIL_PORT}`,
			path: '/',
			method: 'POST',
		})

		expect(tape.owns(rewritten)).toBe(true)
	})

	it('disowns an interaction recorded against another state', () => {
		const tape = anvilTape({
			chainId: BASE_CHAIN_ID,
			pathToState: stateFile(SOME_STATE),
		})

		expect(
			tape.owns({
				scope: `http://anvil-${BASE_CHAIN_ID}:80`,
				path: '/?state=deadbe',
				method: 'POST',
			}),
		).toBe(false)
	})
})

// The fingerprint only earns its keep if it survives nock.define(), which
// keeps a scope's origin and drops its query. Asserting on the tape's own
// output cannot see that: both sides are the tape talking to itself.
describe('anvil tape fingerprint through nock', () => {
	afterEach(() => {
		nock.cleanAll()
	})

	function replayThrough(recordedWith: string, requestedWith: string) {
		const recording = anvilTape({
			chainId: BASE_CHAIN_ID,
			pathToState: stateFile(recordedWith),
		})

		vi.spyOn(recording.anvil, 'port', 'get').mockReturnValue(ANVIL_PORT)

		const taped = recording.normalize({
			scope: `http://127.0.0.1:${ANVIL_PORT}`,
			path: '/',
			method: 'POST',
			body: {},
			status: 200,
			response: { result: 'from the tape' },
		})

		nock.define([taped])

		const replaying = anvilTape({
			chainId: BASE_CHAIN_ID,
			pathToState: stateFile(requestedWith),
		})

		return fetch(replaying.replayed().rpcUrl, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: '{}',
		})
	}

	it('replays what it recorded when the state is unchanged', async () => {
		const response = await replayThrough(SOME_STATE, SOME_STATE)

		await expect(response.json()).resolves.toEqual({
			result: 'from the tape',
		})
	})

	it('misses rather than answering for a state that changed', async () => {
		await expect(replayThrough(SOME_STATE, ANOTHER_STATE)).rejects.toThrow()
	})
})

describe('anvil tape teardown', () => {
	// afterAll runs even when beforeAll died, and a throwing stop() would
	// bury the failure that actually mattered under one about cleanup.
	it('survives being stopped after a start that never happened', async () => {
		await expect(
			anvilTape({ chainId: BASE_CHAIN_ID }).stop(),
		).resolves.toBeUndefined()
	})
})

describe('anvil tape when the process never came up', () => {
	// A recording run that died before anvil bound a port still reaches
	// saveRecording in afterAll. Throwing from normalize there would bury the
	// failure that actually mattered under one about cleanup.
	it('leaves an interaction alone rather than asking for a port', () => {
		const definition: nock.Definition = {
			scope: 'https://li.quest:443',
			path: '/v1/quote',
			method: 'GET',
		}

		expect(
			anvilTape({ chainId: BASE_CHAIN_ID }).normalize(definition),
		).toEqual(definition)
	})
})
