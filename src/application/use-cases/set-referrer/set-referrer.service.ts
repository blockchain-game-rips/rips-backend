import { Injectable } from '@nestjs/common'
import { User } from '../../../domain/entities/user'
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error'
import { UserRepository } from '../../interfaces/repositories/user.repository'
import { SetReferrerInput, SetReferrerUseCase } from './set-referrer.use-case'

@Injectable()
export class SetReferrerService extends SetReferrerUseCase {
	constructor(private readonly userRepository: UserRepository) {
		super()
	}

	async execute(input: SetReferrerInput): Promise<User> {
		const user = await this.userRepository.findByTelegramId(
			input.telegramId,
		)

		if (!user) {
			throw new UserNotFoundError(`User not found: ${input.telegramId}`)
		}

		return this.userRepository.setReferrer(user.id, input.referrerAddress)
	}
}
