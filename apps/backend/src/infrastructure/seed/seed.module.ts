import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { GetAvailableStakesModule } from '../../modules/use-cases/get-available-stakes.module'
import { PrismaModule } from '../prisma/prisma.module'
import { SeedCardDefinitionsService } from './seed-card-definitions.service'

@Module({
	imports: [
		GetAvailableStakesModule,
		PrismaModule,
		ConfigModule.forRoot({ isGlobal: true }),
	],
	providers: [SeedCardDefinitionsService],
	exports: [SeedCardDefinitionsService],
})
export class SeedModule {}
