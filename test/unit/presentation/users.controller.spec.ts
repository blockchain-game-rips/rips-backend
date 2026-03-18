import {
	CreateUserUseCase,
	UserAlreadyExistsError,
} from 'src/application/use-cases/create-user/create-user.use-case'
import {
	GetUserUseCase,
	UserNotFoundError,
} from 'src/application/use-cases/get-user/get-user.use-case'
import { EIP155 } from 'src/constants'
import { User } from 'src/domain/entities/user'
import { toTelegramId } from 'src/domain/value-objects/telegram-id'
import { UsersController } from 'src/presentation/users/users.controller'
const TELEGRAM_ID = toTelegramId(123456n)
const EVM_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'

const MOCK_USER: User = {
	id: 1n,
	telegramId: TELEGRAM_ID,
	wallets: { [EIP155]: EVM_ADDRESS },
	createdAt: new Date('2026-01-01'),
}

function makeMockGetUserUseCase(): jest.Mocked<GetUserUseCase> {
	const mock: jest.Mocked<GetUserUseCase> = { execute: jest.fn() }
	return mock
}

function makeMockCreateUserUseCase(): jest.Mocked<CreateUserUseCase> {
	const mock: jest.Mocked<CreateUserUseCase> = { execute: jest.fn() }
	return mock
}

describe('UsersController', () => {
	let getUser: jest.Mocked<GetUserUseCase>
	let createUser: jest.Mocked<CreateUserUseCase>
	let controller: UsersController

	beforeEach(() => {
		getUser = makeMockGetUserUseCase()
		createUser = makeMockCreateUserUseCase()
		controller = new UsersController(getUser, createUser)
	})

	describe('GET /users/:telegramId', () => {
		it('should return user response dto', async () => {
			getUser.execute.mockResolvedValue(MOCK_USER)

			const result = await controller.getUser(TELEGRAM_ID)

			expect(result).toEqual({
				id: '1',
				telegramId: '123456',
				wallets: { [EIP155]: EVM_ADDRESS },
				createdAt: '2026-01-01T00:00:00.000Z',
			})
		})

		it('should propagate UserNotFoundError', async () => {
			getUser.execute.mockRejectedValue(
				new UserNotFoundError('not found'),
			)

			await expect(controller.getUser(TELEGRAM_ID)).rejects.toThrow(
				UserNotFoundError,
			)
		})
	})

	describe('POST /users', () => {
		it('should return created user response dto', async () => {
			createUser.execute.mockResolvedValue(MOCK_USER)

			const result = await controller.createUser({
				telegramId: TELEGRAM_ID,
			})

			expect(result).toEqual({
				id: '1',
				telegramId: '123456',
				wallets: { [EIP155]: EVM_ADDRESS },
				createdAt: '2026-01-01T00:00:00.000Z',
			})
		})

		it('should propagate UserAlreadyExistsError', async () => {
			createUser.execute.mockRejectedValue(
				new UserAlreadyExistsError('exists'),
			)

			await expect(
				controller.createUser({ telegramId: TELEGRAM_ID }),
			).rejects.toThrow(UserAlreadyExistsError)
		})
	})
})
