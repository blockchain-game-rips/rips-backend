import { Injectable, Logger } from '@nestjs/common'
import { EIP155 } from '../../../constants'
import { EntryPayout } from '../../../domain/value-objects/entry-payout'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'
import { EntryPayoutRepository } from '../../interfaces/repositories/entry-payout.repository'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	RevealEntryPayoutsInput,
	RevealEntryPayoutsUseCase,
} from './reveal-entry-payouts.use-case'

@Injectable()
export class RevealEntryPayoutsService extends RevealEntryPayoutsUseCase {
	private readonly logger = new Logger(RevealEntryPayoutsService.name)

	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly entryPayoutRepository: EntryPayoutRepository,
	) {
		super()
	}

	async execute({
		telegramId,
		revealAll,
	}: RevealEntryPayoutsInput): Promise<EntryPayout[]> {
		const user = await this.getUserUseCase.execute({ telegramId })
		const userAddress = toEvmAddress(user.wallet.namespaceToAddress[EIP155])

		if (revealAll) {
			const payouts =
				await this.entryPayoutRepository.revealAllAndGet(userAddress)

			for (const payout of payouts) {
				this.logger.log(
					{
						userId: user.id.toString(),
						entryId: payout.entryNumber,
						payoutAmount: payout.payoutAmount.toString(),
						cardId: payout.card.id,
						cardTier: payout.card.tier,
					},
					'Payout revealed',
				)
			}

			return payouts
		}

		const payout =
			await this.entryPayoutRepository.revealAndGet(userAddress)

		if (payout) {
			this.logger.log(
				{
					userId: user.id.toString(),
					entryId: payout.entryNumber,
					payoutAmount: payout.payoutAmount.toString(),
					cardId: payout.card.id,
					cardTier: payout.card.tier,
				},
				'Payout revealed',
			)
		}

		return payout ? [payout] : []
	}
}
