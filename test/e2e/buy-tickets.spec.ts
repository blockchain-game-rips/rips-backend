import { GetAvailableStakesUseCase } from 'src/application/use-cases/get-available-stakes/get-available-stakes.use-case'
import request from 'supertest'
import { parseEther } from 'viem'
import { setNativeBalance } from '../utils/anvil'
import { useRipsApp } from '../utils/rips-app'

const STAKE_ID = 1
const TICKET_COST = parseEther('0.005')
const TICKET_AMOUNT = 2

const USER_TG_ID = '999888777'

const mockGetAvailableStakesUseCase: Pick<GetAvailableStakesUseCase, 'execute'> = {
	execute: async () => [
		{
			stake: { id: STAKE_ID, currentConfig: null },
			fillingRound: {
				id: 1,
				stake: { id: STAKE_ID, currentConfig: null },
				config: {
					id: 1,
					ticketCup: 8,
					feePercent: 0,
					ticketPrice: { currency: {} as never, amount: TICKET_COST },
					durationSeconds: 86400,
					prizeDistribution: [],
				},
				currency: {} as never,
				actions: { purchases: [], claims: [], refunds: [] },
				status: 'FILLING' as never,
				startTime: new Date(),
			},
		},
	],
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
		const requiredBalance = TICKET_COST * BigInt(TICKET_AMOUNT) * 2n

		await setNativeBalance(ctx.publicClient, walletAddress, requiredBalance)

		const res = await request(ctx.app.getHttpServer())
			.post(`/rips/users/${USER_TG_ID}/buy-tickets`)
			.send({ stakeId: STAKE_ID, amount: TICKET_AMOUNT })
			.expect(201)

		expect(res.body.txId).toMatch(/^0x[0-9a-fA-F]{64}$/)
		expect(res.body.roundId).toBeGreaterThan(0)
		expect(res.body.ticketAmount).toBe(TICKET_AMOUNT)
		expect(typeof res.body.cost.amount).toBe('string')
	})
})
