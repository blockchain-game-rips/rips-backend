import { DeBridgeApiService } from '../../src/infrastructure/de-bridge/de-bridge-api.service'
import {
	Order,
	OrderState,
} from '../../src/infrastructure/de-bridge/schemas/order-status.schema'

export type MockOrderParams = {
	state: OrderState
	srcChainId: number
	dstChainId?: number
	srcTxHash: string
	dstTxHash: string | null
}

export function createMockDeBridgeApiService(): DeBridgeApiService {
	const real = new DeBridgeApiService()

	return {
		fetchCreateTx: real.fetchCreateTx.bind(real),
		getOrder: jest.fn(),
	}
}

export function mockGetOrder(
	service: DeBridgeApiService,
	params: MockOrderParams,
): void {
	const order: Order = {
		state: params.state,
		giveOfferWithMetadata: {
			chainId: { stringValue: String(params.srcChainId) },
		},
		takeOfferWithMetadata:
			params.dstChainId !== undefined
				? { chainId: { stringValue: String(params.dstChainId) } }
				: null,
		createdSrcEventMetadata: {
			transactionHash: { stringValue: params.srcTxHash },
		},
		fulfilledDstEventMetadata: params.dstTxHash
			? { transactionHash: { stringValue: params.dstTxHash } }
			: null,
	}

	jest.mocked(service.getOrder).mockResolvedValue(order)
}
