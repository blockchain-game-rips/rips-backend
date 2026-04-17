import request from 'supertest'
import { getAddress, parseEther } from 'viem'
import { GetAvailableStakesUseCase } from '../../src/application/use-cases/get-available-stakes/get-available-stakes.use-case'
import { EIP155 } from '../../src/constants'
import { Currency } from '../../src/domain/entities/currency'
import { composeChainId } from '../../src/domain/services/chain-id-utils'
import { composeCurrencyId } from '../../src/domain/services/currency-id-utils'
import { AvailableStake } from '../../src/domain/value-objects/available-stake'
import { setNativeBalance } from '../utils/anvil'
import { useRipsApp } from '../utils/rips-app'

const STAKE_ID = 1
const TICKET_COST = parseEther('0.005')
const TICKET_COUNT = 2

const USER_TG_ID = '999888777'

const ANVIL_CHAIN_ID = 31337
const NATIVE_ADDRESS = getAddress('0x0000000000000000000000000000000000000000')

const nativeCurrency: Currency = {
	id: composeCurrencyId(
		composeChainId(EIP155, ANVIL_CHAIN_ID.toString()),
		NATIVE_ADDRESS,
	),
	chainAddress: {
		chain: { namespace: EIP155, reference: ANVIL_CHAIN_ID.toString() },
		address: NATIVE_ADDRESS,
	},
	symbol: 'ETH',
	name: 'ETH',
	decimals: 18,
}

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
						ticketCup: 8,
						feePercent: 0,
						ticketPrice: {
							currency: nativeCurrency,
							amount: TICKET_COST,
						},
						durationSeconds: 86400,
						prizeDistribution: [],
					},
					currency: nativeCurrency,
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
			.post(`/rips/users/${USER_TG_ID}/buy-tickets`)
			.send({
				stakeId: STAKE_ID,
				ticketCount: TICKET_COUNT,
				paymentCurrencyChainAddress: {
					address: '0x0000000000000000000000000000000000000000',
					chain: { namespace: 'eip155', reference: '31337' },
				},
			})
			.expect(201)

		expect(res.body.type).toBe('purchased')
		expect(res.body.transaction.id).toMatch(/^0x[0-9a-fA-F]{64}$/)
		expect(res.body.roundId).toBeGreaterThan(0)
		expect(res.body.ticketCount).toBe(TICKET_COUNT)
		expect(typeof res.body.transaction.cost.amount).toBe('string')
	})
})
