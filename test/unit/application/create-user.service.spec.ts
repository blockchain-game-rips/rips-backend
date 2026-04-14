import { getAddress } from 'viem'
import { KmsService } from '../../../src/application/interfaces/kms.service'
import { UserRepository } from '../../../src/application/interfaces/repositories/user.repository'
import { CreateUserService } from '../../../src/application/use-cases/create-user/create-user.service'
import { UserAlreadyExistsError } from '../../../src/application/use-cases/create-user/create-user.use-case'
import { EIP155 } from '../../../src/constants'
import { User } from '../../../src/domain/entities/user'
import { toTelegramId } from '../../../src/domain/value-objects/telegram-id'
const TELEGRAM_ID = toTelegramId(123456n)
const EVM_ADDRESS = getAddress('0x1234567890abcdef1234567890abcdef12345678')
const KMS_KEY_ID = 'kms-key-123'

const MOCK_USER: User = {
	id: 1n,
	telegramProfile: { telegramId: TELEGRAM_ID },
	wallet: { kind: 'user', namespaceToAddress: { [EIP155]: EVM_ADDRESS } },
	referrerAddress: null,
	createdAt: new Date('2026-01-01'),
}

function makeMockUserRepository(): jest.Mocked<UserRepository> {
	const mock: jest.Mocked<UserRepository> = {
		findByTelegramId: jest.fn(),
		findByEvmAddress: jest.fn(),
		create: jest.fn(),
		setReferrer: jest.fn(),
	}
	return mock
}

function makeMockKmsService(): jest.Mocked<KmsService> {
	const mock: jest.Mocked<KmsService> = {
		createEvmKey: jest.fn().mockResolvedValue({
			kmsKeyId: KMS_KEY_ID,
			evmAddress: EVM_ADDRESS,
		}),
		signTransaction: jest.fn(),
	}
	return mock
}

describe('CreateUserService', () => {
	let repo: jest.Mocked<UserRepository>
	let kms: jest.Mocked<KmsService>
	let service: CreateUserService

	beforeEach(() => {
		repo = makeMockUserRepository()
		kms = makeMockKmsService()
		service = new CreateUserService(repo, kms)
	})

	it('should create user with KMS key and return it', async () => {
		repo.findByTelegramId.mockResolvedValue(null)
		repo.create.mockResolvedValue(MOCK_USER)

		const result = await service.execute({
			telegramId: TELEGRAM_ID,
			referrerAddress: null,
		})

		expect(kms.createEvmKey).toHaveBeenCalledTimes(1)
		expect(repo.create).toHaveBeenCalledWith(
			TELEGRAM_ID,
			EVM_ADDRESS,
			KMS_KEY_ID,
			null,
		)
		expect(result).toEqual(MOCK_USER)
	})

	it('should throw UserAlreadyExistsError when user exists', async () => {
		repo.findByTelegramId.mockResolvedValue(MOCK_USER)

		await expect(
			service.execute({ telegramId: TELEGRAM_ID, referrerAddress: null }),
		).rejects.toThrow(UserAlreadyExistsError)

		expect(kms.createEvmKey).not.toHaveBeenCalled()
		expect(repo.create).not.toHaveBeenCalled()
	})
})
