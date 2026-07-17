import { ChainAddress } from '../../../domain/value-objects/chain-address'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type GetBalancesInput = {
	currencyChainAddresses: ChainAddress[]
	telegramId: TelegramId
}

export abstract class GetBalancesUseCase {
	abstract execute(input: GetBalancesInput): Promise<CurrencyAmount[]>
}
