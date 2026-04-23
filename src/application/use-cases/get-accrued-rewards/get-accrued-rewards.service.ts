import { Injectable } from '@nestjs/common'
import { EIP155 } from '../../../constants'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'
import { RewardRepository } from '../../interfaces/repositories/reward.repository'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	GetAccruedRewardsInput,
	GetAccruedRewardsUseCase,
} from './get-accrued-rewards.use-case'

@Injectable()
export class GetAccruedRewardsService extends GetAccruedRewardsUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly rewardRepository: RewardRepository,
	) {
		super()
	}

	async execute(input: GetAccruedRewardsInput): Promise<CurrencyAmount[]> {
		const user = await this.getUserUseCase.execute({
			telegramId: input.telegramId,
		})

		const userAddress = toEvmAddress(user.wallet.namespaceToAddress[EIP155])

		return this.rewardRepository.getAccruedRewards(userAddress)
	}
}
