import { ChainAddress } from '../../../domain/value-objects/chain-address'
import { TransactionQuote } from '../../../domain/value-objects/transaction'

export type QuotePurchaseInput = {
	stakeId: number
	ticketCount: number
	paymentCurrencyChainAddress: ChainAddress
}

export abstract class QuotePurchaseUseCase {
	abstract execute(input: QuotePurchaseInput): Promise<TransactionQuote>
}
