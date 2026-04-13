import { Injectable } from '@nestjs/common'
import { KmsService } from 'src/application/interfaces/kms.service'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { User } from 'src/domain/entities/user'
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
