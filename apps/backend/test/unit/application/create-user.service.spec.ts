import { CreateUserService } from '../../../src/application/use-cases/create-user/create-user.service'
import { UserAlreadyExistsError } from '../../../src/application/use-cases/create-user/create-user.use-case'
import { ENCRYPTED_KEY, MOCK_USER, TELEGRAM_ID } from '../../fixtures/entities'
import {
	makeMockEncryptionService,
	makeMockUserRepository,
} from '../../mocks/use-cases'

describe('CreateUserService', () => {
	const repo = makeMockUserRepository()
	const encryption = makeMockEncryptionService()
	const service = new CreateUserService(repo, encryption)

	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should create user with a generated wallet and return it', async () => {
		repo.findByTelegramId.mockResolvedValue(null)
		repo.findByEvmAddress.mockResolvedValue(null)
		repo.create.mockResolvedValue(MOCK_USER)

		const result = await service.execute({
			telegramId: TELEGRAM_ID,
			referrerAddress: undefined,
		})

		expect(encryption.encrypt).toHaveBeenCalledTimes(1)
		expect(repo.create).toHaveBeenCalledWith(
			TELEGRAM_ID,
			expect.any(String),
			ENCRYPTED_KEY,
			undefined,
		)
		expect(result).toEqual(MOCK_USER)
	})

	it('should throw UserAlreadyExistsError when user exists', async () => {
		repo.findByTelegramId.mockResolvedValue(MOCK_USER)

		await expect(
			service.execute({
				telegramId: TELEGRAM_ID,
				referrerAddress: undefined,
			}),
		).rejects.toThrow(UserAlreadyExistsError)

		expect(encryption.encrypt).not.toHaveBeenCalled()
		expect(repo.create).not.toHaveBeenCalled()
	})
})
