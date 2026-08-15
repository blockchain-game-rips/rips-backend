import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { AppConfigModule } from '../../configuration/app-config.module'
import { GetAvailablePresetsModule } from '../../modules/use-cases/get-available-presets.module'
import { CurrencyRegistryModule } from '../currency-registry/currency-registry.module'
import { PrismaModule } from '../prisma/prisma.module'
import { SeedCardDefinitionsService } from './seed-card-definitions.service'

@Module({
	imports: [
		GetAvailablePresetsModule,
		PrismaModule,
		AppConfigModule,
		CurrencyRegistryModule,
		CacheModule.register({ isGlobal: true }),
	],
	providers: [SeedCardDefinitionsService],
	exports: [SeedCardDefinitionsService],
})
export class SeedModule {}
