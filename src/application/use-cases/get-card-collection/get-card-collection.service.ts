import { Injectable } from '@nestjs/common'
import { EIP155 } from '../../../constants'
import { CardCollection } from '../../../domain/value-objects/card-collection'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'
import { TicketPrizeRepository } from '../../interfaces/repositories/ticket-prize.repository'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	GetCardCollectionInput,
	GetCardCollectionUseCase,
} from './get-card-collection.use-case'

@Injectable()
export class GetCardCollectionService extends GetCardCollectionUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly ticketPrizeRepository: TicketPrizeRepository,
	) {
		super()
	}

	async execute({
		telegramId,
		stakeId,
	}: GetCardCollectionInput): Promise<CardCollection[]> {
		const user = await this.getUserUseCase.execute({ telegramId })

		const userAddress = toEvmAddress(user.wallet.namespaceToAddress[EIP155])

		return this.ticketPrizeRepository.getCardCollectionsByStake(
			userAddress,
			stakeId,
		)
	}
}
