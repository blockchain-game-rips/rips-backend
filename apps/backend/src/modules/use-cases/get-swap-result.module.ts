import { Module } from '@nestjs/common'
import { GetSwapResultService } from '../../application/use-cases/get-swap-result/get-swap-result.service'
import { GetSwapResultUseCase } from '../../application/use-cases/get-swap-result/get-swap-result.use-case'
import { ZapModule } from '../../infrastructure/zap/zap.module'

@Module({
	imports: [ZapModule],
	providers: [
		{ provide: GetSwapResultUseCase, useClass: GetSwapResultService },
	],
	exports: [GetSwapResultUseCase],
})
export class GetSwapResultModule {}
