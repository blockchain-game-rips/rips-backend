import { Injectable } from '@nestjs/common'
import { ZapSwapResult } from '../../../domain/value-objects/zap'
import { ZapService } from '../../interfaces/zap.service'
import {
	GetSwapResultInput,
	GetSwapResultUseCase,
} from './get-swap-result.use-case'

@Injectable()
export class GetSwapResultService extends GetSwapResultUseCase {
	constructor(private readonly zapService: ZapService) {
		super()
	}

	async execute(input: GetSwapResultInput): Promise<ZapSwapResult | null> {
		return this.zapService.getSwapResult(input.zapId)
	}
}
