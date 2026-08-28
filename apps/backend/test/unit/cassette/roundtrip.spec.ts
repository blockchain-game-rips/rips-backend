import nock from 'nock'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer, Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ignoringRequestId } from '../../utils/cassette/request-id'

/**
 * Exercises the record -> save -> replay cycle the helper performs, against a
 * real server, to prove the tape nock writes is the tape nock can load back.
 */
describe('cassette round-trip', () => {
	let server: Server
	let origin: string
	let dir: string
	let hits = 0

	beforeAll(async () => {
		dir = mkdtempSync(join(tmpdir(), 'cassette-'))

		server = createServer((_req, res) => {
			hits += 1
			res.writeHead(200, { 'content-type': 'application/json' })
			res.end(JSON.stringify({ hits }))
		})

		await new Promise<void>((resolve) => server.listen(0, resolve))

		const address = server.address()
		if (address === null || typeof address === 'string') {
			throw new Error('server did not bind a port')
		}

		origin = `http://127.0.0.1:${address.port}`
	})

	afterAll(async () => {
		await new Promise((resolve) => server.close(resolve))
		rmSync(dir, { recursive: true, force: true })
	})

	it('replays the recorded responses in order, without the server', async () => {
		nock.recorder.rec({ dont_print: true, output_objects: true })

		const first = await (await fetch(`${origin}/x`)).json()
		const second = await (await fetch(`${origin}/x`)).json()

		const played = nock.recorder.play()
		nock.recorder.clear()
		nock.restore()

		expect(first).toEqual({ hits: 1 })
		expect(second).toEqual({ hits: 2 })
		expect(played).toHaveLength(2)

		const tape = join(dir, 'tape.json')
		const { writeFileSync } = await import('node:fs')
		writeFileSync(tape, JSON.stringify(played, null, 2))
		expect(existsSync(tape)).toBe(true)

		// Same request twice must yield the two different recorded answers,
		// not the first one twice: that ordering is what keeps a
		// before/after balance assertion honest.
		nock.activate()
		nock.define(JSON.parse(readFileSync(tape, 'utf8')))

		const hitsBefore = hits

		expect(await (await fetch(`${origin}/x`)).json()).toEqual({ hits: 1 })
		expect(await (await fetch(`${origin}/x`)).json()).toEqual({ hits: 2 })

		expect(hits).toBe(hitsBefore)
		expect(nock.isDone()).toBe(true)

		nock.cleanAll()
	})

	/**
	 * viem numbers its JSON-RPC requests from a counter that lives in the
	 * module, not in the test, so the same call gets a different id depending
	 * on how many requests the worker made before it. Running one spec on its
	 * own and running it after another therefore produce different bodies for
	 * the same exchange, and a tape that matched the id verbatim would only
	 * replay in the order it was recorded in.
	 */
	it('replays a json-rpc call whose id moved since the recording', async () => {
		const rpcOrigin = 'http://anvil-8453'

		const call = (id: number) => ({
			jsonrpc: '2.0',
			id,
			method: 'anvil_setBalance',
			params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x1'],
		})

		if (!nock.isActive()) {
			nock.activate()
		}

		nock.define(
			[
				{
					scope: `${rpcOrigin}:80`,
					method: 'POST',
					path: '/',
					body: call(RECORDED_REQUEST_ID),
					status: 200,
					response: {
						jsonrpc: '2.0',
						id: RECORDED_REQUEST_ID,
						result: null,
					},
				},
			].map(ignoringRequestId),
		)

		const response = await fetch(rpcOrigin, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(call(REPLAYED_REQUEST_ID)),
		})

		expect(response.status).toBe(200)

		// A json-rpc client pairs a reply to its call by id, so the answer has
		// to come back under the id that was asked, not the taped one.
		expect(await response.json()).toMatchObject({
			id: REPLAYED_REQUEST_ID,
		})

		nock.cleanAll()
	})
})

// Two ids for one call: what the recording captured, and what the counter had
// climbed to by the time another spec replayed it.
const RECORDED_REQUEST_ID = 20
const REPLAYED_REQUEST_ID = 46
