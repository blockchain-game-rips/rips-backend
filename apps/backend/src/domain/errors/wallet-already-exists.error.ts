import { createCustomError } from '../../utils/common'

export const WalletAlreadyExistsError = createCustomError(
	'WalletAlreadyExistsError',
)
