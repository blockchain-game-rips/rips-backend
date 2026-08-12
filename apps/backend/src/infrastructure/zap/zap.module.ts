import { Module } from '@nestjs/common'
import { ZapService } from '../../application/interfaces/zap.service'
import { DeBridgeModule } from '../de-bridge/de-bridge.module'
import { LiFiModule } from '../li-fi/li-fi.module'
import { ZapServiceImpl } from './zap.service'

@Module({
	imports: [DeBridgeModule, LiFiModule],
	providers: [
		{
			provide: ZapService,
			useClass: ZapServiceImpl,
		},
	],
	exports: [ZapService],
})
export class ZapModule {}
