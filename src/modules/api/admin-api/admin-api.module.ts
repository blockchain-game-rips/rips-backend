import { Module } from '@nestjs/common'
import { AdminController } from '../../../presentation/admin/admin.controller'
import { SetDefaultReferralFeeModule } from '../../use-cases/set-default-referral-fee.module'
import { SetPausedModule } from '../../use-cases/set-paused.module'
import { SetReferralTiersModule } from '../../use-cases/set-referral-tiers.module'
import { SetReferrerFrozenModule } from '../../use-cases/set-referrer-frozen.module'

@Module({
	imports: [
		SetPausedModule,
		SetReferrerFrozenModule,
		SetDefaultReferralFeeModule,
		SetReferralTiersModule,
	],
	controllers: [AdminController],
})
export class AdminApiModule {}
