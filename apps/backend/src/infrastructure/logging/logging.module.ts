import { Module } from '@nestjs/common'
import { IncomingMessage, ServerResponse } from 'http'
import { LoggerModule } from 'nestjs-pino'
import { isProd } from '../../constants'

@Module({
	imports: [
		LoggerModule.forRoot({
			pinoHttp: {
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
				transport: isProd ? undefined : { target: 'pino-pretty' },
			},
		}),
	],
})
export class LoggingModule {}
