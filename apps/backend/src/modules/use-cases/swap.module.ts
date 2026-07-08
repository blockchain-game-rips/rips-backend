import { Module } from '@nestjs/common'
import { SwapService } from '../../application/use-cases/swap/swap.service'
import { SwapUseCase } from '../../application/use-cases/swap/swap.use-case'
import { WalletModule } from '../../infrastructure/wallet/wallet.module'
import { ZapModule } from '../../infrastructure/zap/zap.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, WalletModule, ZapModule],
	providers: [{ provide: SwapUseCase, useClass: SwapService }],
	exports: [SwapUseCase],
})
export class SwapModule {}
