import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { GetAvailablePresetsModule } from '../../modules/use-cases/get-available-presets.module'
import { PrismaModule } from '../prisma/prisma.module'
import { SeedCardDefinitionsService } from './seed-card-definitions.service'

@Module({
	imports: [
		GetAvailablePresetsModule,
		PrismaModule,
		ConfigModule.forRoot({ isGlobal: true }),
	],
	providers: [SeedCardDefinitionsService],
	exports: [SeedCardDefinitionsService],
})
export class SeedModule {}
