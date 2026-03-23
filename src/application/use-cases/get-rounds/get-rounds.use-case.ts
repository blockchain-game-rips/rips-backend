import { Round } from 'src/domain/entities/round'

export abstract class GetRoundsUseCase {
	abstract execute(): Promise<Round[]>
}
