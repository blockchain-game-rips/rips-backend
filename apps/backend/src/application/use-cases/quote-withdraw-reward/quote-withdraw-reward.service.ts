import { Injectable } from '@nestjs/common'
import { TransactionQuote } from '../../../domain/value-objects/transaction'
import { RipsService } from '../../interfaces/rips.service'
import { QuoteWithdrawRewardUseCase } from './quote-withdraw-reward.use-case'

@Injectable()
export class QuoteWithdrawRewardService extends QuoteWithdrawRewardUseCase {
	constructor(private readonly ripsService: RipsService) {
		super()
	}

	execute(): Promise<TransactionQuote> {
		return this.ripsService.quoteWithdrawReward()
	}
}
