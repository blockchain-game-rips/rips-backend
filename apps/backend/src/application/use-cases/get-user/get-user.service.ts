import { Injectable } from '@nestjs/common'
import { User } from '../../../domain/entities/user'
import { UserRepository } from '../../interfaces/repositories/user.repository'
import {
	GetUserInput,
	GetUserUseCase,
	UserNotFoundError,
} from './get-user.use-case'

@Injectable()
export class GetUserService extends GetUserUseCase {
	constructor(private readonly userRepository: UserRepository) {
		super()
	}

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
