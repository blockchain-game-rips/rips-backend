import { Controller, Get } from '@nestjs/common'
import { z } from 'zod'
import {
	ACCESS_LEVEL_KEY,
	AccessLevel,
	AdminAccess,
	PublicAccess,
	UserAccess,
} from '../../../src/presentation/shared/access/access-level'
import { ADMIN_API_KEY_HEADER } from '../../../src/presentation/shared/access/admin-api-key.header'
import { BOT_API_KEY_HEADER } from '../../../src/presentation/shared/access/bot-api-key.header'

// @nestjs/swagger only exports this key from a private path, so the spec
// restates the literal rather than reaching into the package internals.
// ApiHeader records a header as an `in: 'header'` parameter.
const API_PARAMETERS_METADATA = 'swagger/apiParameters'

const apiParametersSchema = z
	.array(
		z.object({
			name: z.string(),
			in: z.string(),
			required: z.boolean(),
		}),
	)
	.default([])

type ApiHeaderMetadata = z.infer<typeof apiParametersSchema>[number]

function headersOf(handler: object): ApiHeaderMetadata[] {
	const metadata: unknown = Reflect.getMetadata(
		API_PARAMETERS_METADATA,
		handler,
	)

	return apiParametersSchema
		.parse(metadata)
		.filter((parameter) => parameter.in === 'header')
}

function levelOf(handler: object): AccessLevel | undefined {
	const metadata: unknown = Reflect.getMetadata(ACCESS_LEVEL_KEY, handler)

	return z.nativeEnum(AccessLevel).optional().parse(metadata)
}

@Controller('fixture')
class FixtureController {
	@PublicAccess()
	@Get('public')
	public() {}

	@UserAccess()
	@Get('user')
	user() {}

	@AdminAccess()
	@Get('admin')
	admin() {}
}

const handlers = {
	public: FixtureController.prototype.public,
	user: FixtureController.prototype.user,
	admin: FixtureController.prototype.admin,
}

describe('Access level decorators', () => {
	it('marks a public route without demanding a header', () => {
		expect(levelOf(handlers.public)).toBe(AccessLevel.Public)
		expect(headersOf(handlers.public)).toEqual([])
	})

	it('documents the bot key on a user route', () => {
		expect(levelOf(handlers.user)).toBe(AccessLevel.User)
		expect(headersOf(handlers.user)).toEqual([
			expect.objectContaining({
				name: BOT_API_KEY_HEADER,
				required: true,
			}),
		])
	})

	it('documents the admin key on an admin route', () => {
		expect(levelOf(handlers.admin)).toBe(AccessLevel.Admin)
		expect(headersOf(handlers.admin)).toEqual([
			expect.objectContaining({
				name: ADMIN_API_KEY_HEADER,
				required: true,
			}),
		])
	})

	it('documents each level with its own header', () => {
		const [userHeader] = headersOf(handlers.user)
		const [adminHeader] = headersOf(handlers.admin)

		expect(userHeader.name).not.toBe(adminHeader.name)
	})
})
