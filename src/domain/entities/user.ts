import { type Address } from 'viem'
import { TelegramId } from '../value-objects/telegram-id'

export type User = {
	id: bigint
	telegramId: TelegramId
	evmAddress: Address
	createdAt: Date
}
