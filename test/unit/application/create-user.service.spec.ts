import { CreateUserService } from '../../../src/application/use-cases/create-user/create-user.service'
import { UserAlreadyExistsError } from '../../../src/application/use-cases/create-user/create-user.use-case'
import { EVM_ADDRESS, MOCK_USER, TELEGRAM_ID } from '../../fixtures/entities'
import {
	makeMockKmsService,
	makeMockUserRepository,
} from '../../mocks/use-cases'

const KMS_KEY_ID = 'kms-key-123'

describe('CreateUserService', () => {
	const repo = makeMockUserRepository()
	const kms = makeMockKmsService()
	const service = new CreateUserService(repo, kms)

	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should create user with KMS key and return it', async () => {
		repo.findByTelegramId.mockResolvedValue(null)
		repo.create.mockResolvedValue(MOCK_USER)

		const result = await service.execute({
			telegramId: TELEGRAM_ID,
			referrerAddress: undefined,
		})

		expect(kms.createEvmKey).toHaveBeenCalledTimes(1)
		expect(repo.create).toHaveBeenCalledWith(
			TELEGRAM_ID,
			EVM_ADDRESS,
			KMS_KEY_ID,
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

		expect(kms.createEvmKey).not.toHaveBeenCalled()
		expect(repo.create).not.toHaveBeenCalled()
	})
})
