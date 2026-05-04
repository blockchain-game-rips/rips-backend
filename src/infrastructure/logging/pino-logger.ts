import { Logger, PinoLogger } from 'nestjs-pino'

export const pinoLogger = new Logger(
	new PinoLogger({
		pinoHttp: {
			formatters: {
				level(label) {
					return { level: label }
				},
			},
			timestamp: () => `,"time":"${new Date().toISOString()}"`,
			level: 'debug',
		},
	}),
	{},
)
