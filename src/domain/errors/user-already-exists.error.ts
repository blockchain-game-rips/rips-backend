import { createCustomError } from 'src/utils/common'

export const UserAlreadyExistsError = createCustomError(
	'UserAlreadyExistsError',
)
