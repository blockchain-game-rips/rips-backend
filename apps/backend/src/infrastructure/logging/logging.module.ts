import { Module } from '@nestjs/common'
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
				transport: isProd ? undefined : { target: 'pino-pretty' },
			},
		}),
	],
})
export class LoggingModule {}
