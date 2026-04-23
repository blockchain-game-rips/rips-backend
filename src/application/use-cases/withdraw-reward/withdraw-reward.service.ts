import { Injectable } from '@nestjs/common'
import { EIP155 } from '../../../constants'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'
import { Reward } from '../../../domain/value-objects/reward'
import { RewardRepository } from '../../interfaces/repositories/reward.repository'
import { RipsService } from '../../interfaces/rips.service'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	WithdrawRewardInput,
	WithdrawRewardUseCase,
} from './withdraw-reward.use-case'

@Injectable()
export class WithdrawRewardService extends WithdrawRewardUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly rewardRepository: RewardRepository,
		private readonly ripsService: RipsService,
	) {
		super()
	}

	async execute(input: WithdrawRewardInput): Promise<Reward> {
		const { telegramId, currencyAddress } = input

		const user = await this.getUserUseCase.execute({ telegramId })

		const userAddress = toEvmAddress(user.wallet.namespaceToAddress[EIP155])

		const availableRewards =
			await this.rewardRepository.getAvailableRewards(userAddress)

		const rewardAmount = availableRewards.find(
			(r) => r.currency.chainAddress.address === currencyAddress,
		)

		if (!rewardAmount) {
			throw new Error(
				`No available reward for currency at ${currencyAddress}`,
			)
		}

		return this.ripsService.withdrawReward(user.wallet, { currencyAddress })
	}
}
