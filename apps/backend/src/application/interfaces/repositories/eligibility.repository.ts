import {
	EligibilityPolicy,
	UserEligibility,
} from '../../../domain/entities/eligibility'
import { CountryCode } from '../../../domain/value-objects/country-code'
import { TelegramId } from '../../../domain/value-objects/telegram-id'

export type EligibilityWrite = {
	telegramId: TelegramId
	country: string
	termsVersion: number
	acceptedAt: Date
}

export abstract class EligibilityRepository {
	abstract findPolicy(): Promise<EligibilityPolicy | null>

	abstract findByTelegramId(
		telegramId: TelegramId,
	): Promise<UserEligibility | null>

	/**
	 * Overwrites any previous record for the user wholesale — the gate keeps no
	 * history, only the latest pass.
	 */
	abstract record(input: EligibilityWrite): Promise<UserEligibility>

	abstract replaceBlockedCountries(
		blockedCountries: CountryCode[],
	): Promise<EligibilityPolicy>

	/**
	 * Writes the document and the version bump together. The transaction lives
	 * here rather than in the use-case so the two can never be issued as
	 * separate statements by a future caller.
	 */
	abstract replaceTermsDocument(
		termsFile: Uint8Array<ArrayBuffer>,
	): Promise<EligibilityPolicy>
}
