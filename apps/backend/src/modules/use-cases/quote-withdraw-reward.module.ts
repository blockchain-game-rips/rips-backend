import { Module } from '@nestjs/common'
import { QuoteWithdrawRewardService } from '../../application/use-cases/quote-withdraw-reward/quote-withdraw-reward.service'
import { QuoteWithdrawRewardUseCase } from '../../application/use-cases/quote-withdraw-reward/quote-withdraw-reward.use-case'
import { RipsModule } from '../../infrastructure/rips/rips.module'

@Module({
	imports: [RipsModule],
	providers: [
		{
			provide: QuoteWithdrawRewardUseCase,
			useClass: QuoteWithdrawRewardService,
		},
	],
	exports: [QuoteWithdrawRewardUseCase],
})
export class QuoteWithdrawRewardModule {}
