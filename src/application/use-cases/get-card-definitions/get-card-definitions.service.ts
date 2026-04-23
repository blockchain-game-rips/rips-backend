import { Injectable } from '@nestjs/common'
import { Card } from '../../../domain/value-objects/card'
import { TicketPrizeRepository } from '../../interfaces/repositories/ticket-prize.repository'
import {
	GetCardDefinitionsInput,
	GetCardDefinitionsUseCase,
} from './get-card-definitions.use-case'

@Injectable()
export class GetCardDefinitionsService extends GetCardDefinitionsUseCase {
	constructor(private readonly ticketPrizeRepository: TicketPrizeRepository) {
		super()
	}

	async execute({ stakeId }: GetCardDefinitionsInput): Promise<Card[][]> {
		return this.ticketPrizeRepository.getCardDefinitionsByStake(stakeId)
	}
}
