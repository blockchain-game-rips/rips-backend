import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { TransactionQuote } from '../../../domain/value-objects/transaction'

export type QuoteWithdrawRewardInput = {
	telegramId: TelegramId
	currencyAddress: EvmAddress
}

export abstract class QuoteWithdrawRewardUseCase {
	abstract execute(input: QuoteWithdrawRewardInput): Promise<TransactionQuote>
}
