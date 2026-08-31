import { applyDecorators, SetMetadata } from '@nestjs/common'
import { ApiHeader } from '@nestjs/swagger'
import { ADMIN_API_KEY_HEADER } from './admin-api-key.header'
import { BOT_API_KEY_HEADER } from './bot-api-key.header'

export enum AccessLevel {
	Public = 'public',
	User = 'user',
	Admin = 'admin',
}

export const ACCESS_LEVEL_KEY = 'accessLevel'

/**
 * One decorator carries both halves of a route's access level: the metadata the
 * guard enforces and the header the OpenAPI document advertises. Splitting them
 * would let the schema drift from what the guard actually demands.
 *
 * The level belongs on the handler, never on the controller: a class-level level
 * that a method overrides would document one header and enforce another.
 * `AccessCoverageValidator` rejects both a missing level and a class-level one.
 */
const guardedAccess = (level: AccessLevel, header: string) =>
	applyDecorators(
		SetMetadata(ACCESS_LEVEL_KEY, level),
		ApiHeader({ name: header, required: true }),
	)

// Bare on purpose: a public route has no key to send, so it has no header to
// document. Routing it through guardedAccess would advertise one.
export const PublicAccess = () =>
	SetMetadata(ACCESS_LEVEL_KEY, AccessLevel.Public)

export const UserAccess = () =>
	guardedAccess(AccessLevel.User, BOT_API_KEY_HEADER)

export const AdminAccess = () =>
	guardedAccess(AccessLevel.Admin, ADMIN_API_KEY_HEADER)
