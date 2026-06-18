import { EvmAddress } from '../value-objects/evm-address'
import { TelegramProfile } from '../value-objects/telegram-profile'
import { UserWallet } from '../value-objects/wallet'

export type User = {
	id: bigint
	telegramProfile: TelegramProfile
	wallet: UserWallet
	referrerAddress: EvmAddress | null
	createdAt: Date
}
