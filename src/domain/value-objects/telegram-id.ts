import { createCustomError } from 'src/utils/common'

export type TelegramId = bigint & { readonly _brand: 'TelegramId' }

export const TelegramIdError = createCustomError('TelegramIdError')

export function toTelegramId(value: bigint): TelegramId {
	if (value <= 0n) {
		throw new TelegramIdError(
			`TelegramId must be a positive bigint, got: ${value}`,
		)
	}

	return value as TelegramId
}
