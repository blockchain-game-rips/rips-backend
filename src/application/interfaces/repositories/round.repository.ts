import { Round } from 'src/domain/entities/round'
import { AddressesActions } from 'src/domain/value-objects/actions'

export abstract class RoundRepository {
	abstract getRounds(): Promise<Round[]>
	abstract getActions(round: Round): Promise<AddressesActions>
}
