import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
	private readonly logger = new Logger(LoggingMiddleware.name)

	use(req: Request, _res: Response, next: NextFunction) {
		const { method, originalUrl, body } = req

		this.logger.log(`${method} ${originalUrl} ${JSON.stringify(body)}`)

		next()
	}
}
