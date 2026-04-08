import { TelegramProfile } from '../value-objects/telegram-profile'
import { UserWallet } from '../value-objects/wallet'

export type User = {
	id: bigint
	telegramProfile: TelegramProfile
	wallet: UserWallet
	createdAt: Date
}
