import { ZapSwapResult } from '../../../domain/value-objects/zap'

export type GetSwapResultInput = {
	zapId: string
}

export abstract class GetSwapResultUseCase {
	abstract execute(input: GetSwapResultInput): Promise<ZapSwapResult | null>
}
