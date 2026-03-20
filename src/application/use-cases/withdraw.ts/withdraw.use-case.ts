import { InsufficientBalanceError } from 'src/domain/errors/insufficient-balance.error'
import { TransactionFailedError } from 'src/domain/errors/transaction-failed.error'
import { ChainAddress } from 'src/domain/value-objects/chain-address'
import { TelegramId } from 'src/domain/value-objects/telegram-id'
import { Transaction } from 'src/domain/value-objects/transaction'

export { InsufficientBalanceError, TransactionFailedError }

export type WithdrawInput = {
	telegramId: TelegramId
	amount: bigint
	recipientChainAddress: ChainAddress
}

export abstract class WithdrawUseCase {
	abstract execute(input: WithdrawInput): Promise<Transaction>
}
