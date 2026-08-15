import { setNativeBalance } from '@rips/test-harness'
import request from 'supertest'
import {
	BALANCE_BUFFER_MULTIPLIER,
	ENTRY_COST,
	NATIVE_CURRENCY_CHAIN_ADDRESS,
} from '../fixtures/entities'
import { useRipsApp } from '../utils/rips-app'

const PRESET_ID = 1
const ENTRY_COUNT = 2

const USER_TG_ID = '999888777'

describe('Buy entries E2E', () => {
	const ctx = useRipsApp()

	it('creates a user', async () => {
		const res = await request(ctx.app.getHttpServer())
			.post('/users')
			.send({ telegramId: USER_TG_ID })
			.expect(201)

		expect(res.body.wallets['eip155']).toMatch(/^0x[0-9a-fA-F]{40}$/)
	})

	it('buys entries and returns tx with rip and entry info', async () => {
		const userRes = await request(ctx.app.getHttpServer())
			.get(`/users/${USER_TG_ID}`)
			.expect(200)

		const walletAddress = userRes.body.wallets['eip155']
		const requiredBalance =
			ENTRY_COST * BigInt(ENTRY_COUNT) * BALANCE_BUFFER_MULTIPLIER

		await setNativeBalance(ctx.publicClient, walletAddress, requiredBalance)

		const res = await request(ctx.app.getHttpServer())
			.post('/rips/entries/purchase')
			.set('x-telegram-id', USER_TG_ID)
			.send({
				presetId: PRESET_ID,
				entryCount: ENTRY_COUNT,
				paymentCurrencyChainAddress: NATIVE_CURRENCY_CHAIN_ADDRESS,
			})
			.expect(200)

		const { purchase } = res.body

		expect(purchase.status).toBe('succeeded')
		expect(purchase.transaction.id).toMatch(/^0x[0-9a-fA-F]{64}$/)
		expect(purchase.result.ripId).toBeGreaterThan(0)
		expect(purchase.result.entryCount).toBe(ENTRY_COUNT)
		expect(purchase.result.startEntryIndex).toBeGreaterThanOrEqual(0)
		expect(typeof purchase.transaction.cost.amount).toBe('string')
	})
})
