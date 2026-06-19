import { setNativeBalance } from '@rips/test-harness'
import request from 'supertest'
import { parseEther } from 'viem'
import { GetAvailableStakesUseCase } from '../../src/application/use-cases/get-available-stakes/get-available-stakes.use-case'
import { AvailableStake } from '../../src/domain/value-objects/available-stake'
import { ANVIL_NATIVE_CURRENCY } from '../fixtures/entities'
import { useRipsApp } from '../utils/rips-app'

const STAKE_ID = 1
const TICKET_COST = parseEther('0.005')
const TICKET_COUNT = 2

const USER_TG_ID = '999888777'

const mockGetAvailableStakesUseCase: Pick<
	GetAvailableStakesUseCase,
	'execute'
> = {
	execute: (): Promise<AvailableStake[]> =>
		Promise.resolve([
			{
				stake: { id: STAKE_ID, currentConfig: null },
				fillingRound: {
					id: 1,
					stake: { id: STAKE_ID, currentConfig: null },
					config: {
						id: 1,
						ticketCap: 8,
						feePercent: 0,
						ticketPrice: {
							currency: ANVIL_NATIVE_CURRENCY,
							amount: TICKET_COST,
						},
						durationSeconds: 86400,
						prizeDistribution: [],
					},
					currency: ANVIL_NATIVE_CURRENCY,
					actions: { purchases: [], claims: [], refunds: [] },
					status: 'FILLING' as never,
					startTime: new Date(),
				},
			},
		]),
}

describe('Buy tickets E2E', () => {
	const ctx = useRipsApp((builder) =>
		builder
			.overrideProvider(GetAvailableStakesUseCase)
			.useValue(mockGetAvailableStakesUseCase),
	)

	it('creates a user', async () => {
		const res = await request(ctx.app.getHttpServer())
			.post('/users')
			.send({ telegramId: USER_TG_ID })
			.expect(201)

		expect(res.body.wallets['eip155']).toMatch(/^0x[0-9a-fA-F]{40}$/)
	})

	it('buys tickets and returns tx with round and ticket info', async () => {
		const userRes = await request(ctx.app.getHttpServer())
			.get(`/users/${USER_TG_ID}`)
			.expect(200)

		const walletAddress = userRes.body.wallets['eip155']
		const requiredBalance = TICKET_COST * BigInt(TICKET_COUNT) * 2n

		await setNativeBalance(ctx.publicClient, walletAddress, requiredBalance)

		const res = await request(ctx.app.getHttpServer())
			.post('/rips/tickets/purchase')
			.set('x-telegram-id', USER_TG_ID)
			.send({
				stakeId: STAKE_ID,
				ticketCount: TICKET_COUNT,
				paymentCurrencyChainAddress: {
					address: '0x0000000000000000000000000000000000000000',
					chain: { namespace: 'eip155', reference: '31337' },
				},
			})
			.expect(201)

		expect(res.body.transaction.id).toMatch(/^0x[0-9a-fA-F]{64}$/)
		expect(res.body.roundId).toBeGreaterThan(0)
		expect(res.body.ticketCount).toBe(TICKET_COUNT)
		expect(typeof res.body.transaction.cost.amount).toBe('string')
	})
})
