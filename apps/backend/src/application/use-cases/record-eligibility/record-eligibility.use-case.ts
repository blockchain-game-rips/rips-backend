import { UserEligibility } from '../../../domain/entities/eligibility'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type RecordEligibilityInput = {
	telegramId: TelegramId
	country: string
	termsVersion: number
}

export abstract class RecordEligibilityUseCase {
	abstract execute(input: RecordEligibilityInput): Promise<UserEligibility>
}
