import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../../generated/prisma-indexer'
import { getEnvSafe } from '../../utils/common'

@Injectable()
export class IndexerPrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	constructor() {
		super({
			adapter: new PrismaPg({
				connectionString: getEnvSafe('INDEXER_DATABASE_URL'),
			}),
		})
	}

	async onModuleInit() {
		await this.$connect()
	}

	async onModuleDestroy() {
		await this.$disconnect()
	}
}
