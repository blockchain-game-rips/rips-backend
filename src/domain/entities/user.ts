import { TelegramProfile } from '../value-objects/telegram-profile'
import { Wallet } from '../value-objects/wallet'

export type User = {
	id: bigint
	telegramProfile: TelegramProfile
	wallet: Wallet
	createdAt: Date
}
