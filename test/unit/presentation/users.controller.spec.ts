import { UserAlreadyExistsError } from '../../../src/application/use-cases/create-user/create-user.use-case'
import { UserNotFoundError } from '../../../src/application/use-cases/get-user/get-user.use-case'
import { EIP155 } from '../../../src/constants'
import { UsersController } from '../../../src/presentation/users/users.controller'
import { EVM_ADDRESS, MOCK_USER, TELEGRAM_ID } from '../../fixtures/entities'
import {
	makeMockCreateUserUseCase,
	makeMockGetUserUseCase,
} from '../../mocks/use-cases'

describe('UsersController', () => {
	const getUser = makeMockGetUserUseCase()
	const createUser = makeMockCreateUserUseCase()
	const controller = new UsersController(getUser, createUser)

	beforeEach(() => {
		jest.clearAllMocks()
	})

	const EXPECTED_USER_DTO = {
		id: '1',
		telegramId: '123456',
		wallets: { [EIP155]: EVM_ADDRESS },
		createdAt: '2026-01-01T00:00:00.000Z',
	}

	describe('GET /users/:telegramId', () => {
		it('should return user response dto', async () => {
			getUser.execute.mockResolvedValue(MOCK_USER)

			const result = await controller.getUser({ telegramId: TELEGRAM_ID })

			expect(result).toEqual(EXPECTED_USER_DTO)
		})

		it('should propagate UserNotFoundError', async () => {
			getUser.execute.mockRejectedValue(
				new UserNotFoundError('not found'),
			)

			await expect(
				controller.getUser({ telegramId: TELEGRAM_ID }),
			).rejects.toThrow(UserNotFoundError)
		})
	})

	describe('POST /users', () => {
		it('should return created user response dto', async () => {
			createUser.execute.mockResolvedValue(MOCK_USER)

			const result = await controller.createUser({
				telegramId: TELEGRAM_ID,
				referrerAddress: undefined,
			})

			expect(result).toEqual(EXPECTED_USER_DTO)
		})

		it('should propagate UserAlreadyExistsError', async () => {
			createUser.execute.mockRejectedValue(
				new UserAlreadyExistsError('exists'),
			)

			await expect(
				controller.createUser({
					telegramId: TELEGRAM_ID,
					referrerAddress: undefined,
				}),
			).rejects.toThrow(UserAlreadyExistsError)
		})
	})
})
