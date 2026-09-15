import { Injectable, Logger } from '@nestjs/common'
import { ZapSwapResult } from '../../../domain/value-objects/zap'
import { ZapService } from '../../interfaces/zap.service'
import {
	GetSwapResultInput,
	GetSwapResultUseCase,
} from './get-swap-result.use-case'

@Injectable()
export class GetSwapResultService extends GetSwapResultUseCase {
	private readonly logger = new Logger(GetSwapResultService.name)

	constructor(private readonly zapService: ZapService) {
		super()
	}

	async execute(input: GetSwapResultInput): Promise<ZapSwapResult | null> {
		const result = await this.zapService.getSwapResult(input.zapId)

		// The zap outlives the request that sent it, so its id is what ties a
		// settled swap back to the one the user started.
		this.logger.log(
			{ zapId: input.zapId, settled: result !== null },
			'Polled crosschain swap result',
		)

		return result
	}
}
