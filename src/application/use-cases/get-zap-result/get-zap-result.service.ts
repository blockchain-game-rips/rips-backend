import { Injectable } from '@nestjs/common'
import { ZapBuyResult } from '../../../domain/value-objects/zap'
import { ZapService } from '../../interfaces/zap.service'
import { GetZapResultInput, GetZapResultUseCase } from './get-zap-result.use-case'

@Injectable()
export class GetZapResultService extends GetZapResultUseCase {
	constructor(private readonly zapService: ZapService) {
		super()
	}

	async execute(input: GetZapResultInput): Promise<ZapBuyResult | null> {
		return this.zapService.getBuyResult({ zapId: input.zapId } as Parameters<ZapService['getBuyResult']>[0])
	}
}
