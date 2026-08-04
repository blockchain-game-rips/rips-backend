import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { FinishedRipCounts } from '../../interfaces/repositories/rip.repository'

export type GetFinishedRipCountsInput = {
	userAddress: EvmAddress
}

export abstract class GetFinishedRipCountsUseCase {
	abstract execute(
		input: GetFinishedRipCountsInput,
	): Promise<FinishedRipCounts>
}
