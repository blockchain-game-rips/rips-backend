import { Round } from 'src/domain/entities/round'

export abstract class RoundRepository {
	abstract getRounds(): Promise<Round[]>
}
