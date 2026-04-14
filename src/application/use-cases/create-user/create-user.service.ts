import { Injectable } from '@nestjs/common'
import { User } from '../../../domain/entities/user'
import { KmsService } from '../../interfaces/kms.service'
import { UserRepository } from '../../interfaces/repositories/user.repository'
import {
	CreateUserInput,
	CreateUserUseCase,
	UserAlreadyExistsError,
} from './create-user.use-case'

@Injectable()
export class CreateUserService extends CreateUserUseCase {
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

		const { kmsKeyId, evmAddress } = await this.kmsService.createEvmKey()

		return this.userRepository.create(
			input.telegramId,
			evmAddress,
			kmsKeyId,
			input.referrerAddress,
		)
	}
}
