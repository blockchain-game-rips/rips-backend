import { Injectable } from '@nestjs/common'
import { EIP155 } from '../../../constants'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'
import { TransactionAttemptWith } from '../../../domain/value-objects/transaction-attempt'
import { ReferralSystemRepository } from '../../interfaces/repositories/referral-system.repository'
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
		private readonly referralSystemRepository: ReferralSystemRepository,
		private readonly ripsService: RipsService,
	) {
		super()
	}

	async execute(
		input: WithdrawRewardInput,
	): Promise<TransactionAttemptWith<CurrencyAmount>> {
		const { telegramId, currencyAddress } = input

		const user = await this.getUserUseCase.execute({ telegramId })

		const userAddress = toEvmAddress(user.wallet.namespaceToAddress[EIP155])

		const referrer =
			await this.referralSystemRepository.getReferrerByAddress(
				userAddress,
			)

		const state = referrer.states.find(
			(r) => r.currency.chainAddress.address === currencyAddress,
		)

		if (!state || state.rewards.available === 0n) {
			throw new Error(
				`No reward to withdraw for address ${userAddress} and currency ${currencyAddress}`,
			)
		}

		return this.ripsService.withdrawReward(user.wallet, { currencyAddress })
	}
}
