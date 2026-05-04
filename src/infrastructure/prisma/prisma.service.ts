import {
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit,
} from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Histogram } from 'prom-client'
import { PrismaClient } from '../../generated/prisma'
import { getEnvSafe } from '../../utils/common'

type PrismaServiceOptions = {
	log: [{ emit: 'event'; level: 'query' }]
	adapter: PrismaPg
}

const SLOW_QUERY_THRESHOLD_MS = 500

@Injectable()
export class PrismaService
	extends PrismaClient<PrismaServiceOptions>
	implements OnModuleInit, OnModuleDestroy
{
	private readonly logger = new Logger(PrismaService.name)

	constructor(
		@InjectMetric('prisma_query_duration_seconds')
		private readonly queryDuration: Histogram<string>,
	) {
		super({
			log: [{ emit: 'event', level: 'query' }],
			adapter: new PrismaPg({
				connectionString: getEnvSafe('DATABASE_URL'),
			}),
		})
	}

	async onModuleInit() {
		this.$on('query', (event) => {
			this.queryDuration.observe(event.duration / 1000)

			if (event.duration >= SLOW_QUERY_THRESHOLD_MS) {
				this.logger.warn(
					{ query: event.query, durationMs: event.duration },
					'Slow query detected',
				)
			}
		})

		await this.$connect()
	}

	async onModuleDestroy() {
		await this.$disconnect()
	}
}
