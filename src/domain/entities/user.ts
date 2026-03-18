import { TelegramId } from '../value-objects/telegram-id'
import { EvmWallet } from './evm-wallet'

export type User = {
	id: bigint
	telegramId: TelegramId
	evmWallet: EvmWallet
	createdAt: Date
}
