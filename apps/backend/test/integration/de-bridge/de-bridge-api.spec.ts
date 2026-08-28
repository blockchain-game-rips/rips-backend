import { CacheModule } from '@nestjs/cache-manager'
import { Test } from '@nestjs/testing'
import { DeBridgeApiService } from '../../../src/infrastructure/de-bridge/de-bridge-api.service'
import { externalTapes } from '../../utils/cassette/host-tape'
import { useVcr } from '../../utils/cassette/use-vcr'

const FULFILLED_ORDER_ID =
	'0xc4a83ba91f9d6cd438606e1616ef652abf9563296f12be0361f53ff999917aa0'
const CREATED_ORDER_ID =
	'0x77dc952671c2753de869ac0f076cd6c1e12d8af983ca4b08d91d2eb6ac2af4ce'
const CANCELLED_ORDER_ID =
	'0xd1a71424848a80bfd0f08b4c8ccb2f573604132f74be4e3fd156e0afd069d706'

describe('DeBridgeApiService', () => {
	let service: DeBridgeApiService

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [CacheModule.register()],
			providers: [DeBridgeApiService],
		}).compile()

		service = moduleRef.get(DeBridgeApiService)
	})

	describe('getOrder', () => {
		useVcr(externalTapes())

		it('returns ClaimedUnlock state for a fulfilled and unlocked order', async () => {
			const order = await service.getOrder(FULFILLED_ORDER_ID)

			expect(order.state).toBe('ClaimedUnlock')
			expect(order.fulfilledDstEventMetadata).not.toBeNull()
			expect(
				order.createdSrcEventMetadata.transactionHash.stringValue,
			).toBeTruthy()
		})

		it('returns Created state for a permanently created order', async () => {
			const order = await service.getOrder(CREATED_ORDER_ID)

			expect(order.state).toBe('Created')
			expect(order.fulfilledDstEventMetadata).toBeNull()
			expect(
				order.createdSrcEventMetadata.transactionHash.stringValue,
			).toBeTruthy()
		})

		it('returns cancelled state for a cancelled order', async () => {
			const order = await service.getOrder(CANCELLED_ORDER_ID)

			expect([
				'SentOrderCancel',
				'OrderCancelled',
				'ClaimedOrderCancel',
			]).toContain(order.state)
			expect(order.fulfilledDstEventMetadata).toBeNull()
		})
	})
})
