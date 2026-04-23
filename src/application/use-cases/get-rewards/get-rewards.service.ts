import { Injectable } from '@nestjs/common'
import { EIP155 } from '../../../constants'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'
import { RewardRepository } from '../../interfaces/repositories/reward.repository'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { GetRewardsInput, GetRewardsUseCase } from './get-rewards.use-case'

@Injectable()
export class GetRewardsService extends GetRewardsUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly rewardRepository: RewardRepository,
	) {
		super()
	}

	async execute(input: GetRewardsInput): Promise<CurrencyAmount[]> {
		const user = await this.getUserUseCase.execute({
			telegramId: input.telegramId,
		})

		const userAddress = toEvmAddress(user.wallet.namespaceToAddress[EIP155])

		return this.rewardRepository.getAvailableRewards(userAddress)
	}
}
