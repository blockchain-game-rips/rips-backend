import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { GetUserService } from 'src/application/use-cases/get-user/get-user.service'
import { UserNotFoundError } from 'src/application/use-cases/get-user/get-user.use-case'
import { User } from 'src/domain/entities/user'
import { toChainNamespace } from 'src/domain/value-objects/chain-namespace'
import { toTelegramId } from 'src/domain/value-objects/telegram-id'

const EIP155 = toChainNamespace('eip155')
const TELEGRAM_ID = toTelegramId(123456n)

const MOCK_USER: User = {
	id: 1n,
	telegramId: TELEGRAM_ID,
	wallets: { [EIP155]: '0x1234567890abcdef1234567890abcdef12345678' },
	createdAt: new Date('2026-01-01'),
}

function makeMockUserRepository(): jest.Mocked<UserRepository> {
	const mock: jest.Mocked<UserRepository> = {
		findByTelegramId: jest.fn(),
		create: jest.fn(),
	}
	return mock
}

describe('GetUserService', () => {
	let repo: jest.Mocked<UserRepository>
	let service: GetUserService

	beforeEach(() => {
		repo = makeMockUserRepository()
		service = new GetUserService(repo)
	})

	it('should return user when found', async () => {
		repo.findByTelegramId.mockResolvedValue(MOCK_USER)

		const result = await service.execute({ telegramId: TELEGRAM_ID })

		expect(result).toEqual(MOCK_USER)
		expect(repo.findByTelegramId).toHaveBeenCalledWith(TELEGRAM_ID)
	})

	it('should throw UserNotFoundError when user does not exist', async () => {
		repo.findByTelegramId.mockResolvedValue(null)

		await expect(
			service.execute({ telegramId: TELEGRAM_ID }),
		).rejects.toThrow(UserNotFoundError)
	})
})
