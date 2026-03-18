import { ChainNamespace } from '../value-objects/chain-namespace'
import { TelegramId } from '../value-objects/telegram-id'

export type User = {
	id: bigint
	telegramId: TelegramId
	wallets: Record<ChainNamespace, string>
	createdAt: Date
}
