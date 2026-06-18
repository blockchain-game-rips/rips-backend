import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { Reward } from '../../../domain/value-objects/reward'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type WithdrawRewardInput = {
	telegramId: TelegramId
	currencyAddress: EvmAddress
}

export abstract class WithdrawRewardUseCase {
	abstract execute(input: WithdrawRewardInput): Promise<Reward>
}
