import { Module } from '@nestjs/common'
import { CurrencyModule } from '../../../infrastructure/currency/currency.module'
import { AdminController } from '../../../presentation/admin/admin.controller'
import { GetAdminWalletModule } from '../../use-cases/get-admin-wallet.module'
import { SetDefaultReferralFeeModule } from '../../use-cases/set-default-referral-fee.module'
import { SetPausedModule } from '../../use-cases/set-paused.module'
import { SetReferralTiersModule } from '../../use-cases/set-referral-tiers.module'
import { SetReferrerCustomFeeModule } from '../../use-cases/set-referrer-custom-fee.module'
import { SetReferrerFrozenModule } from '../../use-cases/set-referrer-frozen.module'
import { UpdatePresetConfigModule } from '../../use-cases/update-preset-config.module'

@Module({
	imports: [
		GetAdminWalletModule,
		SetPausedModule,
		SetReferrerFrozenModule,
		SetReferrerCustomFeeModule,
		SetDefaultReferralFeeModule,
		SetReferralTiersModule,
		UpdatePresetConfigModule,
		CurrencyModule,
	],
	controllers: [AdminController],
})
export class AdminApiModule {}
