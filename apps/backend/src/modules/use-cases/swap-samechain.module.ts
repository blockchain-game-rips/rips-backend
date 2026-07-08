import { Module } from '@nestjs/common'
import { SwapSamechainService } from '../../application/use-cases/swap-samechain/swap-samechain.service'
import { SwapSamechainUseCase } from '../../application/use-cases/swap-samechain/swap-samechain.use-case'
import { WalletModule } from '../../infrastructure/wallet/wallet.module'
import { ZapModule } from '../../infrastructure/zap/zap.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, WalletModule, ZapModule],
	providers: [
		{ provide: SwapSamechainUseCase, useClass: SwapSamechainService },
	],
	exports: [SwapSamechainUseCase],
})
export class SwapSamechainModule {}
