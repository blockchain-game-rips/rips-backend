import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common'
import { Request } from 'express'
import { getEnvSafe } from '../../utils/common'
import { ADMIN_API_KEY_HEADER } from './admin-api-key.header'

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
	private readonly adminApiKey = getEnvSafe('ADMIN_API_KEY')

	canActivate(ctx: ExecutionContext): boolean {
		const request = ctx.switchToHttp().getRequest<Request>()
		const key = request.headers[ADMIN_API_KEY_HEADER]

		if (key !== this.adminApiKey) {
			throw new ForbiddenException()
		}

		return true
	}
}
