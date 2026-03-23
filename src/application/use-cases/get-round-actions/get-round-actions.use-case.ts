import { Round } from 'src/domain/entities/round'
import { AddressesActions } from 'src/domain/value-objects/actions'

export abstract class GetRoundActionsUseCase {
	abstract execute(round: Round): Promise<AddressesActions>
}
