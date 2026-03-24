import { Round } from 'src/domain/entities/round'

export type HandleClaimInput = {
	round: Round
}

export abstract class HandleClaimUseCase {
	abstract execute(input: HandleClaimInput): Promise<void>
}
