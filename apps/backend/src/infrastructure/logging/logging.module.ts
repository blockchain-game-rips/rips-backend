import { Module } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { IncomingMessage, ServerResponse } from 'http'
import { LoggerModule } from 'nestjs-pino'

const REQUEST_ID_HEADER = 'x-request-id'

/**
 * Keeps the caller's request id so one button press stays a single thread
 * across the bot and the backend. Callers without one — workers, the keeper —
 * still get an id of their own.
 */
function resolveRequestId(req: IncomingMessage): string {
	const header = req.headers[REQUEST_ID_HEADER]

	if (typeof header === 'string' && header !== '') return header

	return randomUUID()
}

@Module({
	imports: [
		LoggerModule.forRoot({
			pinoHttp: {
				genReqId: resolveRequestId,
				formatters: {
					level(label: string) {
						return { level: label }
					},
				},
				timestamp: () => `,"time":"${new Date().toISOString()}"`,
				serializers: {
					req(req: IncomingMessage) {
						return { method: req.method, url: req.url }
					},
					res(res: ServerResponse) {
						return { statusCode: res.statusCode }
					},
				},
			},
		}),
	],
})
export class LoggingModule {}
