import nock from 'nock'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer, Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

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
})
