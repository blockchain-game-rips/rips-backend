import { Inject, Injectable } from '@nestjs/common'
import {
	KMS_SERVICE_TOKEN,
	KmsService,
} from 'src/application/interfaces/kms.service'
import {
	USER_REPOSITORY_TOKEN,
	UserRepository,
} from 'src/application/interfaces/repositories/user.repository'
import { User } from 'src/domain/entities/user'
import {
	CreateUserInput,
	CreateUserUseCase,
	UserAlreadyExistsError,
} from './create-user.use-case'

@Injectable()
export class CreateUserService implements CreateUserUseCase {
	constructor(
		@Inject(USER_REPOSITORY_TOKEN)
		private readonly userRepository: UserRepository,

		@Inject(KMS_SERVICE_TOKEN)
		private readonly kmsService: KmsService,
	) {}

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
		)
	}
}
