import { createCustomError } from '../../utils/common'

/**
 * The user has never been gated. Distinct from every stored state, which is why
 * absence is reported rather than a record with empty fields.
 */
export const EligibilityNotFoundError = createCustomError(
	'EligibilityNotFoundError',
)
