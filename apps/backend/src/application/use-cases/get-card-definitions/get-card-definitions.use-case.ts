import { Card } from '../../../domain/value-objects/card'

export type GetCardDefinitionsInput = {
	presetId: number
}

export abstract class GetCardDefinitionsUseCase {
	abstract execute(input: GetCardDefinitionsInput): Promise<Card[][]>
}
