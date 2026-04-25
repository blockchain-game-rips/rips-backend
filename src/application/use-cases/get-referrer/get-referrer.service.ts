import { Injectable } from '@nestjs/common'
import { EIP155 } from '../../../constants'
import { Referrer } from '../../../domain/entities/referrer'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'
import { ReferralSystemRepository } from '../../interfaces/repositories/referral-system.repository'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { GetReferrerInput, GetReferrerUseCase } from './get-referrer.use-case'

@Injectable()
export class GetReferrerService extends GetReferrerUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly referrerRepository: ReferralSystemRepository,
	) {
		super()
	}

	async execute(input: GetReferrerInput): Promise<Referrer> {
		const { telegramId } = input

		const user = await this.getUserUseCase.execute({
			telegramId,
		})

		const evmAddress = toEvmAddress(user.wallet.namespaceToAddress[EIP155])

		const referrer =
			await this.referrerRepository.getReferrerByAddress(evmAddress)

		return referrer
	}
}
