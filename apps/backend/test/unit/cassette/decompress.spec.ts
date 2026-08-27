import nock from 'nock'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { decompressResponse } from '../../utils/cassette/decompress'

// Past one 16 KiB decoder chunk, which is where a replayed brotli body used to
// come back cut in half.
const BODY = { items: Array.from({ length: 2_000 }, (_, index) => index) }

const definitionFor = (
	response: nock.ReplyBody,
	rawHeaders: Record<string, string>,
): nock.Definition => ({
	scope: 'https://example.test:443',
	method: 'POST',
	path: '/quote',
	status: 200,
	response,
	rawHeaders,
})

const asHex = (payload: Buffer) => payload.toString('hex')

describe('decompress response', () => {
	it('stores a brotli body as the json it decodes to', () => {
		const definition = definitionFor(
			asHex(brotliCompressSync(Buffer.from(JSON.stringify(BODY)))),
			{ 'content-type': 'application/json', 'content-encoding': 'br' },
		)

		expect(decompressResponse(definition).response).toEqual(BODY)
	})

	it('drops the encoding the body no longer has', () => {
		const definition = definitionFor(
			asHex(gzipSync(Buffer.from(JSON.stringify(BODY)))),
			{ 'content-type': 'application/json', 'content-encoding': 'gzip' },
		)

		const { rawHeaders } = decompressResponse(definition)

		expect(rawHeaders).toEqual({ 'content-type': 'application/json' })
	})

	// Nock records a streamed body as one hex string per chunk it observed.
	it('rejoins a body recorded in pieces before decoding it', () => {
		const hex = asHex(brotliCompressSync(Buffer.from(JSON.stringify(BODY))))
		const half = Math.floor(hex.length / 2)

		const definition = definitionFor(
			[hex.slice(0, half), hex.slice(half)],
			{
				'content-encoding': 'br',
			},
		)

		expect(decompressResponse(definition).response).toEqual(BODY)
	})

	it('leaves an uncompressed body untouched', () => {
		const definition = definitionFor(BODY, {
			'content-type': 'application/json',
		})

		expect(decompressResponse(definition)).toBe(definition)
	})

	it('leaves an encoding it cannot decode untouched', () => {
		const definition = definitionFor('deadbeef', {
			'content-encoding': 'zstd',
		})

		expect(decompressResponse(definition)).toBe(definition)
	})
})
