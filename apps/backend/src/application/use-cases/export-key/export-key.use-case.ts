import { UserNotFoundError } from '../../../domain/errors/user-not-found.error'
import { PrivateKey } from '../../../domain/value-objects/private-key'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export { UserNotFoundError }

export type ExportKeyInput = {
	telegramId: TelegramId
}

export abstract class ExportKeyUseCase {
	abstract execute(input: ExportKeyInput): Promise<PrivateKey>
}
