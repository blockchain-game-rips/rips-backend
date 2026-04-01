import { Executor } from 'src/domain/entities/executor'
import { Round } from 'src/domain/entities/round'

export type HandleClaimInput = {
	round: Round
	executor: Executor
}

export abstract class HandleClaimUseCase {
	abstract execute(input: HandleClaimInput): Promise<void>
}
