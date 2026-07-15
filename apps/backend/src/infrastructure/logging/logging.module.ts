import { Module } from '@nestjs/common'
import { IncomingMessage, ServerResponse } from 'http'
import { LoggerModule } from 'nestjs-pino'

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
			},
		}),
	],
})
export class LoggingModule {}
