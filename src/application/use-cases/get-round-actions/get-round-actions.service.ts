import { RoundRepository } from 'src/application/interfaces/repositories/round.repository'
import { Round } from 'src/domain/entities/round'
import { AddressesActions } from 'src/domain/value-objects/actions'
import { GetRoundActionsUseCase } from './get-round-actions.use-case'

export class GetRoundActionsService extends GetRoundActionsUseCase {
	constructor(private readonly roundRepository: RoundRepository) {
		super()
	}

	async execute(round: Round): Promise<AddressesActions> {
		return await this.roundRepository.getActions(round)
	}
}
