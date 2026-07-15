import { Injectable, Logger } from '@nestjs/common'
import { Hex } from 'viem'
import { User } from '../../../domain/entities/user'
import { KmsKeyResult, KmsService } from '../../interfaces/kms.service'
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
		private readonly kmsService: KmsService,
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

		const walletStart = Date.now()
		const { kmsKeyId, evmAddress } = await this.provisionWallet(
			input.privateKey,
		)
		const walletDurationMs = Date.now() - walletStart

		const user = await this.userRepository.create(
			input.telegramId,
			evmAddress,
			kmsKeyId,
			input.referrerAddress,
		)

		this.logger.log(
			{
				userId: user.id.toString(),
				walletAddress: evmAddress,
				kmsProvider: kmsKeyId,
				durationMs: walletDurationMs,
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

	private async provisionWallet(privateKey?: Hex): Promise<KmsKeyResult> {
		if (privateKey !== undefined) {
			return this.kmsService.importEvmKey(privateKey)
		}

		return this.kmsService.createEvmKey()
	}
}
