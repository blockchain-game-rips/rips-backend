import { Injectable } from '@nestjs/common'
import { EIP155 } from '../../../constants'
import { EntryPayout } from '../../../domain/value-objects/entry-payout'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'
import { EntryPayoutRepository } from '../../interfaces/repositories/entry-payout.repository'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { GetPayoutsInput, GetPayoutsUseCase } from './get-payouts.use-case'

@Injectable()
export class GetPayoutsService extends GetPayoutsUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly entryPayoutRepository: EntryPayoutRepository,
	) {
		super()
	}

	async execute({
		telegramId,
		filter,
	}: GetPayoutsInput): Promise<EntryPayout[]> {
		const user = await this.getUserUseCase.execute({ telegramId })

		return this.entryPayoutRepository.find(
			toEvmAddress(user.wallet.namespaceToAddress[EIP155]),
			filter,
		)
	}
}
