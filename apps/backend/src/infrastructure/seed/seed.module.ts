import { Module } from '@nestjs/common'
import { AppConfigModule } from '../../configuration/app-config.module'
import { GetAvailablePresetsModule } from '../../modules/use-cases/get-available-presets.module'
import { AppCacheModule } from '../cache/app-cache.module'
import { CurrencyRegistryModule } from '../currency-registry/currency-registry.module'
import { PrismaModule } from '../prisma/prisma.module'
import { SeedCardDefinitionsService } from './seed-card-definitions.service'

@Module({
	imports: [
		GetAvailablePresetsModule,
		PrismaModule,
		AppConfigModule,
		CurrencyRegistryModule,
		AppCacheModule,
	],
	providers: [SeedCardDefinitionsService],
	exports: [SeedCardDefinitionsService],
})
export class SeedModule {}
