import { Injectable } from '@nestjs/common'
import { Card } from '../../../domain/value-objects/card'
import { EntryPayoutRepository } from '../../interfaces/repositories/entry-payout.repository'
import {
	GetCardDefinitionsInput,
	GetCardDefinitionsUseCase,
} from './get-card-definitions.use-case'

@Injectable()
export class GetCardDefinitionsService extends GetCardDefinitionsUseCase {
	constructor(private readonly entryPayoutRepository: EntryPayoutRepository) {
		super()
	}

	async execute({ presetId }: GetCardDefinitionsInput): Promise<Card[][]> {
		return this.entryPayoutRepository.getCardDefinitionsByPreset(presetId)
	}
}
