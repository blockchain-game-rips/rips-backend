import {
	classifySendFailure,
	SendPhase,
} from '../../../../../src/infrastructure/evm/utils/classify-send-failure'

const CAUSE = new Error('boom')
const TX_HASH = '0xabc'

describe('classifySendFailure', () => {
	it('reports a preparation failure as not sent', () => {
		expect(classifySendFailure(SendPhase.Preparation, CAUSE)).toEqual({
			status: 'not-sent',
			cause: CAUSE,
		})
	})

	it('reports a signing failure as not sent', () => {
		expect(classifySendFailure(SendPhase.Signing, CAUSE)).toEqual({
			status: 'not-sent',
			cause: CAUSE,
		})
	})

	it('reports a broadcast failure as unknown, because the node may have propagated it', () => {
		expect(classifySendFailure(SendPhase.Broadcast, CAUSE)).toEqual({
			status: 'unknown',
			cause: CAUSE,
		})
	})

	it('reports a receipt failure as unknown and keeps the transaction id', () => {
		expect(classifySendFailure(SendPhase.Receipt, CAUSE, TX_HASH)).toEqual({
			status: 'unknown',
			transactionId: TX_HASH,
			cause: CAUSE,
		})
	})

	it('omits the transaction id when there is no hash', () => {
		expect(
			classifySendFailure(SendPhase.Broadcast, CAUSE),
		).not.toHaveProperty('transactionId')
	})

	it('never claims not-sent once anything was broadcast', () => {
		const broadcastPhases = [SendPhase.Broadcast, SendPhase.Receipt]

		for (const phase of broadcastPhases) {
			expect(classifySendFailure(phase, CAUSE).status).not.toBe(
				'not-sent',
			)
		}
	})
})
