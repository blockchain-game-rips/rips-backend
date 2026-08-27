import nock from 'nock'
import { createServer, Server } from 'node:http'
import { rewriteScope } from '../../utils/cassette/scope-rewrites'
import { replayedAnvilUrl } from '../../utils/cassette/taped-anvil'

const BASE_CHAIN_ID = 8453
const HTTP_OK = 200

/**
 * The whole point of taping anvil: a recording made against a random port has
 * to replay against a stable host, with no process behind it. This drives that
 * cycle against a stand-in for anvil, since the normalization is about ports
 * and scopes rather than about anything the real one does.
 */
describe('anvil url normalization', () => {
	let server: Server
	let port: number
	let calls = 0

	beforeAll(async () => {
		server = createServer((_request, response) => {
			calls += 1

			response.writeHead(HTTP_OK, { 'content-type': 'application/json' })
			response.end(
				JSON.stringify({ jsonrpc: '2.0', id: 1, result: `0x${calls}` }),
			)
		})

		await new Promise<void>((resolve) => server.listen(0, resolve))

		const address = server.address()

		if (address === null || typeof address === 'string') {
			throw new Error('server did not bind a port')
		}

		port = address.port
	})

	afterAll(async () => {
		await new Promise((resolve) => server.close(resolve))
	})

	it('replays a recording made on a random port against a stable host', async () => {
		nock.recorder.rec({ dont_print: true, output_objects: true })

		const liveResult = await rpcCall(`http://127.0.0.1:${port}`)

		const recorded = nock.recorder.play()
		nock.recorder.clear()
		nock.restore()

		expect(liveResult).toBe('0x1')
		expect(recorded).toHaveLength(1)

		const rewrites = new Map([
			[`http://127.0.0.1:${port}`, replayedAnvilUrl(BASE_CHAIN_ID)],
		])

		const tape = recorded
			.filter(isDefinition)
			.map((definition) => rewriteScope(definition, rewrites))

		expect(String(tape[0]?.scope)).toBe(`http://anvil-${BASE_CHAIN_ID}:80`)

		if (!nock.isActive()) {
			nock.activate()
		}

		nock.define(tape)

		const callsBefore = calls

		expect(await rpcCall(`http://anvil-${BASE_CHAIN_ID}`)).toBe('0x1')

		// The stand-in was never reached: the answer came off the tape.
		expect(calls).toBe(callsBefore)

		nock.cleanAll()
	})
})

async function rpcCall(rpcUrl: string): Promise<string> {
	const response = await fetch(rpcUrl, {
		method: 'POST',
		body: JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'eth_blockNumber',
			params: [],
		}),
	})

	const payload: unknown = await response.json()

	if (
		typeof payload !== 'object' ||
		payload === null ||
		!('result' in payload) ||
		typeof payload.result !== 'string'
	) {
		throw new Error('unexpected rpc payload')
	}

	return payload.result
}

function isDefinition(
	played: string | nock.Definition,
): played is nock.Definition {
	return typeof played !== 'string'
}
