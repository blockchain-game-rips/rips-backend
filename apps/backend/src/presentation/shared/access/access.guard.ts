import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { getEnvSafe } from '../../../utils/common'
import { safeCompare } from '../../../utils/safe-compare'
import { ADMIN_API_KEY_HEADER } from '../../admin/admin-api-key.header'
import { BOT_API_KEY_HEADER } from '../bot-api-key.header'
import { ACCESS_LEVEL_KEY, AccessLevel } from './access-level'
import { WHITELISTED_PATHS } from './access-whitelist'

type Credential = { header: string; key: string }

@Injectable()
export class AccessGuard implements CanActivate {
	private readonly credentials: Map<AccessLevel, Credential> = new Map([
		[
			AccessLevel.User,
			{ header: BOT_API_KEY_HEADER, key: getEnvSafe('BOT_API_KEY') },
		],
		[
			AccessLevel.Admin,
			{ header: ADMIN_API_KEY_HEADER, key: getEnvSafe('ADMIN_API_KEY') },
		],
	])

	constructor(private readonly reflector: Reflector) {}

	canActivate(ctx: ExecutionContext): boolean {
		const request = ctx.switchToHttp().getRequest<Request>()

		if (WHITELISTED_PATHS.includes(request.path)) {
			return true
		}

		const level = this.reflector.getAllAndOverride<AccessLevel | undefined>(
			ACCESS_LEVEL_KEY,
			[ctx.getHandler(), ctx.getClass()],
		)

		if (level === AccessLevel.Public) {
			return true
		}

		const credential = this.credentials.get(level ?? AccessLevel.User)

		if (!credential) {
			throw new ForbiddenException()
		}

		return this.assertKey(request, credential.header, credential.key)
	}

	private assertKey(
		request: Request,
		header: string,
		expectedKey: string,
	): boolean {
		const key = request.headers[header]

		if (typeof key !== 'string' || !safeCompare(key, expectedKey)) {
			throw new ForbiddenException()
		}

		return true
	}
}
