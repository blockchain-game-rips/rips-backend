import { createCustomError } from '../../utils/common'

export const UserAlreadyExistsError = createCustomError(
	'UserAlreadyExistsError',
)
