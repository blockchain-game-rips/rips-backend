import { Module } from '@nestjs/common'
import { GetSwapResultService } from '../../application/use-cases/get-swap-result/get-swap-result.service'
import { GetSwapResultUseCase } from '../../application/use-cases/get-swap-result/get-swap-result.use-case'
import { DeBridgeModule } from '../../infrastructure/de-bridge/de-bridge.module'

@Module({
	imports: [DeBridgeModule],
	providers: [
		{ provide: GetSwapResultUseCase, useClass: GetSwapResultService },
	],
	exports: [GetSwapResultUseCase],
})
export class GetSwapResultModule {}
