import { Module } from '@nestjs/common'
import { GetZapResultService } from '../../application/use-cases/get-zap-result/get-zap-result.service'
import { GetZapResultUseCase } from '../../application/use-cases/get-zap-result/get-zap-result.use-case'
import { DeBridgeModule } from '../../infrastructure/de-bridge/de-bridge.module'

@Module({
	imports: [DeBridgeModule],
	providers: [
		{ provide: GetZapResultUseCase, useClass: GetZapResultService },
	],
	exports: [GetZapResultUseCase],
})
export class GetZapResultModule {}
