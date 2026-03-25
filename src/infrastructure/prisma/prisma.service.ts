import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from 'src/generated/prisma'
import { getEnvSafe } from 'src/utils/common'

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	constructor() {
		super({
			adapter: new PrismaPg({
				connectionString: getEnvSafe('DATABASE_URL'),
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
