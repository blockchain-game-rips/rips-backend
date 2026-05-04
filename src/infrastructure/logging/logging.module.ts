import { Module } from '@nestjs/common'
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
			},
		}),
	],
})
export class LoggingModule {}
