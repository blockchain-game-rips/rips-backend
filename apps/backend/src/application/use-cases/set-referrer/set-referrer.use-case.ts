import { User } from '../../../domain/entities/user'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type SetReferrerInput = {
	telegramId: TelegramId
	referrerAddress: EvmAddress | null
}

export abstract class SetReferrerUseCase {
	abstract execute(input: SetReferrerInput): Promise<User>
}
