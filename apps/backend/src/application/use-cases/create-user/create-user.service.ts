import { Injectable, Logger } from '@nestjs/common'
import { User } from '../../../domain/entities/user'
import { WalletAlreadyExistsError } from '../../../domain/errors/wallet-already-exists.error'
import {
	createPrivateKey,
	evmAddressFromPrivateKey,
} from '../../../domain/services/evm'
import { EncryptionService } from '../../interfaces/encryption.service'
import { UserRepository } from '../../interfaces/repositories/user.repository'
import {
	CreateUserInput,
	CreateUserUseCase,
	UserAlreadyExistsError,
} from './create-user.use-case'

@Injectable()
export class CreateUserService extends CreateUserUseCase {
	private readonly logger = new Logger(CreateUserService.name)

	constructor(
		private readonly userRepository: UserRepository,
		private readonly encryptionService: EncryptionService,
	) {
		super()
	}

	async execute(input: CreateUserInput): Promise<User> {
		const existing = await this.userRepository.findByTelegramId(
			input.telegramId,
		)

		if (existing) {
			throw new UserAlreadyExistsError(
				`User already exists: ${input.telegramId}`,
			)
		}

		const privateKey = input.privateKey ?? createPrivateKey()
		const address = evmAddressFromPrivateKey(privateKey)

		const existingWallet =
			await this.userRepository.findByEvmAddress(address)

		if (existingWallet) {
			throw new WalletAlreadyExistsError(
				`Wallet already exists: ${address}`,
			)
		}

		const encryptedKey = await this.encryptionService.encrypt(privateKey)

		const user = await this.userRepository.create(
			input.telegramId,
			address,
			encryptedKey,
			input.referrerAddress,
		)

		this.logger.log(
			{
				userId: user.id.toString(),
				walletAddress: address,
			},
			'Wallet provisioned',
		)

		this.logger.log(
			{
				userId: user.id.toString(),
				...(input.referrerAddress !== undefined && {
					referrerId: input.referrerAddress,
				}),
			},
			'User created',
		)

		return user
	}
}
