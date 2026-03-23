import { ChainAddress } from 'src/domain/value-objects/chain-address'
import { TelegramId } from 'src/domain/value-objects/telegram-id'
import { Transaction } from 'src/domain/value-objects/transaction'

export type WithdrawInput = {
	telegramId: TelegramId
	amount: bigint
	recipientChainAddress: ChainAddress
}

export abstract class WithdrawUseCase {
	abstract execute(input: WithdrawInput): Promise<Transaction>
}
