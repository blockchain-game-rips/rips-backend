import nock from 'nock'
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib'

/**
 * Stores a compressed response as the JSON it decodes to.
 *
 * Nock records the body undici already decompressed and then compresses it
 * again, purely to stay consistent with the `content-encoding` header it also
 * recorded. Replaying that lands in a race: nock hands undici the whole
 * payload at once and closes the stream as soon as its own bytes run out,
 * while the brotli decoder emits in 16 KiB chunks on later ticks. Anything
 * past the first chunk arrives after the body is already closed, so a response
 * over 16 KiB comes back truncated mid-JSON.
 *
 * Dropping the encoding sidesteps the whole family of compression bugs in
 * recorded fixtures rather than timing around this one, and matches where the
 * fetch standard is heading: a decompressed body should not keep claiming an
 * encoding it no longer has. It also leaves the tape readable, which is what
 * makes a committed recording reviewable and greppable for leaked secrets.
 */
export function decompressResponse(
	definition: nock.Definition,
): nock.Definition {
	const headers = definition.rawHeaders

	if (!isHeaders(headers)) {
		return definition
	}

	const encoding = contentEncodingOf(headers)

	if (encoding === undefined) {
		return definition
	}

	const decoded = decode(definition.response, encoding)

	if (decoded === undefined) {
		return definition
	}

	return {
		...definition,
		response: decoded,
		rawHeaders: withoutEncoding(headers),

		// The recorder marks a compressed body binary and writes it as hex. The
		// decoded body is neither, and nock's own Definition type does not admit
		// the flag, so it is cleared through the shape the recorder writes.
		...clearedBinaryFlag,
	}
}

const clearedBinaryFlag: RecordedFlags = { responseIsBinary: false }

type RecordedFlags = { responseIsBinary: boolean }

const CONTENT_ENCODING = 'content-encoding'

const decoders: Record<string, (input: Buffer) => Buffer> = {
	br: brotliDecompressSync,
	deflate: inflateSync,
	gzip: gunzipSync,
}

type Headers = Record<string, string | string[]>

function contentEncodingOf(headers: Headers): string | undefined {
	const encoding = headers[CONTENT_ENCODING]

	if (typeof encoding !== 'string') {
		return undefined
	}

	const normalized = encoding.trim().toLowerCase()

	return normalized in decoders ? normalized : undefined
}

/**
 * A compressed body is recorded as hex, in one piece per chunk nock saw. The
 * pieces are halves of a single stream, so they only decode once rejoined.
 */
function decode(
	response: unknown,
	encoding: string,
): nock.ReplyBody | undefined {
	const hex = hexOf(response)

	if (hex === undefined) {
		return undefined
	}

	const decoded = decoders[encoding]?.(Buffer.from(hex, 'hex'))

	if (decoded === undefined) {
		return undefined
	}

	const parsed: unknown = JSON.parse(decoded.toString('utf8'))

	return isReplyBody(parsed) ? parsed : undefined
}

function isReplyBody(candidate: unknown): candidate is nock.ReplyBody {
	return typeof candidate === 'object' && candidate !== null
}

function hexOf(response: unknown): string | undefined {
	if (typeof response === 'string') {
		return response
	}

	if (Array.isArray(response) && response.every(isString)) {
		return response.join('')
	}

	return undefined
}

function withoutEncoding(headers: Headers): Headers {
	const { [CONTENT_ENCODING]: _dropped, ...rest } = headers

	return rest
}

function isHeaders(candidate: unknown): candidate is Headers {
	return typeof candidate === 'object' && candidate !== null
}

function isString(candidate: unknown): candidate is string {
	return typeof candidate === 'string'
}
