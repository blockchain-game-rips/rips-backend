import { Module } from '@nestjs/common'
import { AppConfigModule } from '../../configuration/app-config.module'
import { AppCacheModule } from '../cache/app-cache.module'
import { CurrencyRegistryModule } from '../currency-registry/currency-registry.module'
import { EncryptionModule } from '../encryption/encryption.module'
import { PrismaModule } from '../prisma/prisma.module'
import { RipsModule } from '../rips/rips.module'
import { ProvisionService } from './provision.service'
import { SetupEligibilityPolicyService } from './setup-eligibility-policy.service'

@Module({
	imports: [
		EncryptionModule,
		PrismaModule,
		RipsModule,
		AppConfigModule,
		CurrencyRegistryModule,
		AppCacheModule,
	],
	providers: [ProvisionService, SetupEligibilityPolicyService],
	exports: [ProvisionService, SetupEligibilityPolicyService],
})
export class ProvisionModule {}
