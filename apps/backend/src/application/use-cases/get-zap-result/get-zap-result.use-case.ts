import { ZapBuyResult } from '../../../domain/value-objects/zap'

export type GetZapResultInput = {
	zapId: string
}

export abstract class GetZapResultUseCase {
	abstract execute(input: GetZapResultInput): Promise<ZapBuyResult | null>
}
