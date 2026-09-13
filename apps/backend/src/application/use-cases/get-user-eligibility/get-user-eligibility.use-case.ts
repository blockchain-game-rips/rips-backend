import { UserEligibility } from '../../../domain/entities/eligibility'
import { EligibilityNotFoundError } from '../../../domain/errors/eligibility-not-found.error'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export { EligibilityNotFoundError }

export type GetUserEligibilityInput = {
	telegramId: TelegramId
}

export abstract class GetUserEligibilityUseCase {
	abstract execute(input: GetUserEligibilityInput): Promise<UserEligibility>
}
