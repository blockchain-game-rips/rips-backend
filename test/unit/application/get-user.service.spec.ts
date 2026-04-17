import { GetUserService } from '../../../src/application/use-cases/get-user/get-user.service'
import { UserNotFoundError } from '../../../src/application/use-cases/get-user/get-user.use-case'
import { MOCK_USER, TELEGRAM_ID } from '../../fixtures/entities'
import { makeMockUserRepository } from '../../mocks/use-cases'

describe('GetUserService', () => {
	const repo = makeMockUserRepository()
	const service = new GetUserService(repo)

	beforeEach(() => {
		jest.clearAllMocks()
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
