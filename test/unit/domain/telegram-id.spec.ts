import {
	TelegramIdError,
	toTelegramId,
} from 'src/domain/value-objects/telegram-id'

describe('toTelegramId', () => {
	it('should return TelegramId for a positive bigint', () => {
		const result = toTelegramId(123456n)

		expect(result).toBe(123456n)
	})

	it('should throw TelegramIdError for zero', () => {
		expect(() => toTelegramId(0n)).toThrow(TelegramIdError)
	})

	it('should throw TelegramIdError for a negative bigint', () => {
		expect(() => toTelegramId(-1n)).toThrow(TelegramIdError)
	})
})
