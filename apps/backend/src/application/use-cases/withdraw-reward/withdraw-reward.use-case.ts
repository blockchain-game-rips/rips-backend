import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { TelegramId } from '../../../domain/value-objects/telegram-id'
import { TransactionAttemptWith } from '../../../domain/value-objects/transaction-attempt'

export type WithdrawRewardInput = {
	telegramId: TelegramId
	currencyAddress: EvmAddress
}

export abstract class WithdrawRewardUseCase {
	abstract execute(
		input: WithdrawRewardInput,
	): Promise<TransactionAttemptWith<CurrencyAmount>>
}
