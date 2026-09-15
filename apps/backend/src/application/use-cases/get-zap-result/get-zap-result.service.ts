import { Injectable, Logger } from '@nestjs/common'
import { ZapBuyResult } from '../../../domain/value-objects/zap'
import { ZapService } from '../../interfaces/zap.service'
import {
	GetZapResultInput,
	GetZapResultUseCase,
} from './get-zap-result.use-case'

@Injectable()
export class GetZapResultService extends GetZapResultUseCase {
	private readonly logger = new Logger(GetZapResultService.name)

	constructor(private readonly zapService: ZapService) {
		super()
	}

	async execute(input: GetZapResultInput): Promise<ZapBuyResult | null> {
		const result = await this.zapService.getBuyResult(input.zapId)

		// The zap outlives the request that sent it, so its id is what ties a
		// settled entry back to the purchase the user started.
		this.logger.log(
			{ zapId: input.zapId, settled: result !== null },
			'Polled crosschain entry result',
		)

		return result
	}
}
