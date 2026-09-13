import { EligibilityPolicy } from '../../../domain/entities/eligibility'
import { CountryCode } from '../../../domain/value-objects/country-code'

export type SetBlockedCountriesInput = {
	blockedCountries: CountryCode[]
}

export abstract class SetBlockedCountriesUseCase {
	abstract execute(
		input: SetBlockedCountriesInput,
	): Promise<EligibilityPolicy>
}
