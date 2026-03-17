import { Inject, Injectable } from '@nestjs/common'
import {
	USER_REPOSITORY_TOKEN,
	UserRepository,
} from 'src/application/interfaces/repositories/user.repository'
import { User } from 'src/domain/entities/user'
import {
	GetUserInput,
	GetUserUseCase,
	UserNotFoundError,
} from './get-user.use-case'

@Injectable()
export class GetUserService implements GetUserUseCase {
	constructor(
		@Inject(USER_REPOSITORY_TOKEN)
		private readonly userRepository: UserRepository,
	) {}

	async execute(input: GetUserInput): Promise<User> {
		const user = await this.userRepository.findByTelegramId(
			input.telegramId,
		)

		if (!user) {
			throw new UserNotFoundError(`User not found: ${input.telegramId}`)
		}

		return user
	}
}
