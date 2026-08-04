import { BadRequestException } from '@nestjs/common'
import { z } from 'zod'
import { FinishedCursor } from '../../../application/interfaces/repositories/rip.repository'

const CURSOR_ENCODING = 'base64url'

const encodedCursorSchema = z.object({
	syncedAt: z.iso.datetime(),
	ripId: z.number().int().positive(),
})

export function encodeFinishedCursor(cursor: FinishedCursor): string {
	const payload = JSON.stringify({
		syncedAt: cursor.syncedAt.toISOString(),
		ripId: cursor.ripId,
	})

	return Buffer.from(payload).toString(CURSOR_ENCODING)
}

// Opaque to clients, so any failure to decode is a malformed request rather
// than something the caller can be told how to fix.
export function decodeFinishedCursor(encoded: string): FinishedCursor {
	let parsed: unknown

	try {
		parsed = JSON.parse(
			Buffer.from(encoded, CURSOR_ENCODING).toString('utf8'),
		)
	} catch {
		throw new BadRequestException('Invalid cursor')
	}

	const result = encodedCursorSchema.safeParse(parsed)

	if (!result.success) {
		throw new BadRequestException('Invalid cursor')
	}

	return {
		syncedAt: new Date(result.data.syncedAt),
		ripId: result.data.ripId,
	}
}
