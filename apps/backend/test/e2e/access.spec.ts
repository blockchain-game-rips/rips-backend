import request from 'supertest'
import { botRequest } from '../utils/bot-request'
import { TEST_ADMIN_API_KEY } from '../utils/env'
import { useRipsApp } from '../utils/rips-app'

const USER_PATH = '/rips/payouts'
const ADMIN_PATH = '/admin'
const PUBLIC_PATH = '/rips/state'
const METRICS_PATH = '/metrics'

const USER_TG_ID = '123123123'
const WRONG_KEY = 'wrong-key'

describe('Access guard E2E', () => {
	const ctx = useRipsApp()

	it('rejects a user route without the bot key', async () => {
		await request(ctx.app.getHttpServer())
			.get(USER_PATH)
			.set('x-telegram-id', USER_TG_ID)
			.expect(403)
	})

	it('rejects a user route with a wrong bot key', async () => {
		await request(ctx.app.getHttpServer())
			.get(USER_PATH)
			.set('x-telegram-id', USER_TG_ID)
			.set('x-bot-key', WRONG_KEY)
			.expect(403)
	})

	it('accepts a user route with the correct bot key', async () => {
		const res = await botRequest(ctx.app.getHttpServer())
			.get(USER_PATH)
			.set('x-telegram-id', USER_TG_ID)

		expect(res.status).not.toBe(403)
	})

	it('rejects an admin route without the admin key', async () => {
		await request(ctx.app.getHttpServer()).get(ADMIN_PATH).expect(403)
	})

	it('rejects an admin route when only the bot key is present', async () => {
		await botRequest(ctx.app.getHttpServer()).get(ADMIN_PATH).expect(403)
	})

	it('accepts an admin route with the correct admin key', async () => {
		await request(ctx.app.getHttpServer())
			.get(ADMIN_PATH)
			.set('x-admin-api-key', TEST_ADMIN_API_KEY)
			.expect(200)
	})

	it('allows a public route without any key', async () => {
		await request(ctx.app.getHttpServer()).get(PUBLIC_PATH).expect(200)
	})

	it('allows the metrics endpoint without any key', async () => {
		await request(ctx.app.getHttpServer()).get(METRICS_PATH).expect(200)
	})
})
