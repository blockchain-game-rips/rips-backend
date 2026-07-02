import { Card } from '../../../domain/value-objects/card'

export abstract class GetCardDefinitionsUseCase {
	abstract execute(): Promise<Card[][]>
}
