import { Injectable } from '@nestjs/common'
import { Card } from '../../../domain/value-objects/card'
import { EntryPayoutRepository } from '../../interfaces/repositories/entry-payout.repository'
import { GetCardDefinitionsUseCase } from './get-card-definitions.use-case'

@Injectable()
export class GetCardDefinitionsService extends GetCardDefinitionsUseCase {
	constructor(private readonly entryPayoutRepository: EntryPayoutRepository) {
		super()
	}

	async execute(): Promise<Card[][]> {
		return this.entryPayoutRepository.getCardDefinitions()
	}
}
