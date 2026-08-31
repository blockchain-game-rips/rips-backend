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
import { ACCESS_LEVEL_KEY, AccessLevel } from './access-level'
import { WHITELISTED_PATHS } from './access-whitelist'
import { ADMIN_API_KEY_HEADER } from './admin-api-key.header'
import { BOT_API_KEY_HEADER } from './bot-api-key.header'

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

		// Handler only: a class-level level would let the guard and the
		// documented header disagree, so the validator rejects one outright.
		const level = this.reflector.get<AccessLevel | undefined>(
			ACCESS_LEVEL_KEY,
			ctx.getHandler(),
		)

		if (level === AccessLevel.Public) {
			return true
		}

		if (!level) {
			throw new ForbiddenException()
		}

		const credential = this.credentials.get(level)

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
