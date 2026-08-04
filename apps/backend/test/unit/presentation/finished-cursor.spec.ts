import { BadRequestException } from '@nestjs/common'
import {
	decodeFinishedCursor,
	encodeFinishedCursor,
} from '../../../src/presentation/rips/get-finished-rips/finished-cursor'

const SYNCED_AT = new Date('2026-05-01T12:34:56.789Z')
const RIP_ID = 42

describe('finished cursor', () => {
	it('round-trips a cursor unchanged', () => {
		const encoded = encodeFinishedCursor({
			syncedAt: SYNCED_AT,
			ripId: RIP_ID,
		})

		expect(decodeFinishedCursor(encoded)).toEqual({
			syncedAt: SYNCED_AT,
			ripId: RIP_ID,
		})
	})

	it('preserves millisecond precision', () => {
		const encoded = encodeFinishedCursor({
			syncedAt: SYNCED_AT,
			ripId: RIP_ID,
		})

		expect(decodeFinishedCursor(encoded).syncedAt.getTime()).toBe(
			SYNCED_AT.getTime(),
		)
	})

	it('does not expose the ordering key in the encoded form', () => {
		const encoded = encodeFinishedCursor({
			syncedAt: SYNCED_AT,
			ripId: RIP_ID,
		})

		expect(encoded).not.toContain('syncedAt')
		expect(encoded).not.toContain(String(RIP_ID))
	})

	it('rejects a cursor that is not base64-encoded JSON', () => {
		expect(() => decodeFinishedCursor('not-a-cursor')).toThrow(
			BadRequestException,
		)
	})

	it('rejects a well-formed payload with a missing field', () => {
		const encoded = Buffer.from(JSON.stringify({ ripId: RIP_ID })).toString(
			'base64url',
		)

		expect(() => decodeFinishedCursor(encoded)).toThrow(BadRequestException)
	})

	it('rejects a payload whose syncedAt is not a date', () => {
		const encoded = Buffer.from(
			JSON.stringify({ syncedAt: 'whenever', ripId: RIP_ID }),
		).toString('base64url')

		expect(() => decodeFinishedCursor(encoded)).toThrow(BadRequestException)
	})

	it('rejects a payload whose ripId is not a positive integer', () => {
		const encoded = Buffer.from(
			JSON.stringify({
				syncedAt: SYNCED_AT.toISOString(),
				ripId: -1,
			}),
		).toString('base64url')

		expect(() => decodeFinishedCursor(encoded)).toThrow(BadRequestException)
	})
})
