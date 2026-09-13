import { createCustomError } from '../../utils/common'

/**
 * The policy singleton is created by initial setup, so its absence means the
 * system has not completed setup — a broken deployment rather than a client
 * mistake.
 */
export const EligibilityPolicyNotFoundError = createCustomError(
	'EligibilityPolicyNotFoundError',
)
