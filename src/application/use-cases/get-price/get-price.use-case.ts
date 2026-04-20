import { ChainAddress } from '../../../domain/value-objects/chain-address'

export type GetPriceInput = {
	currencyChainAddress: ChainAddress
}

export abstract class GetPriceUseCase {
	abstract execute(input: GetPriceInput): Promise<number>
}
