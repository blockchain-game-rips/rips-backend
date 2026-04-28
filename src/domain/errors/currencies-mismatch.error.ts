import { createCustomError } from '../../utils/common'

// TODO: replace some controller errors with that error
export const CurrenciesMismatchError = createCustomError('CurrenciesMismatch')
