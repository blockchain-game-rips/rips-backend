import request from 'supertest'
import {
	FIRST_TERMS_VERSION,
	POLICY_SINGLETON,
} from '../../src/infrastructure/prisma/eligibility.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { SetupEligibilityPolicyService } from '../../src/infrastructure/provision/setup-eligibility-policy.service'
import { TERMS_FILE_FIELD } from '../../src/presentation/eligibility/upload-terms-document/upload-terms-document.request'
import { ADMIN_API_KEY_HEADER } from '../../src/presentation/shared/access/admin-api-key.header'
import { TEST_ADMIN_API_KEY } from '../utils/env'
import { TEST_TERMS_DOCUMENT, useRipsApp } from '../utils/rips-app'
import { userRequest } from '../utils/user-request'

const POLICY_PATH = '/eligibility/policy'
const TERMS_PATH = '/eligibility/policy/terms'
const ELIGIBILITY_PATH = '/eligibility'

const GATED_TELEGRAM_ID = '555000111'
const NEVER_GATED_TELEGRAM_ID = '555000222'

describe('Eligibility E2E', () => {
	const ctx = useRipsApp()

	const adminRequest = () =>
		request
			.agent(ctx.app.getHttpServer())
			.set(ADMIN_API_KEY_HEADER, TEST_ADMIN_API_KEY)

	// Tests mutate the policy, so each one starts from the same freshly set up
	// singleton the harness establishes — via the setup step, never a hand-built
	// row that could drift from what setup actually writes.
	beforeEach(async () => {
		const prisma = ctx.app.get(PrismaService)

		await prisma.userEligibility.deleteMany()
		await prisma.eligibilityPolicy.deleteMany()

		await ctx.app
			.get(SetupEligibilityPolicyService)
			.setup(TEST_TERMS_DOCUMENT)
	})

	// Users outlive the per-test eligibility reset, so a repeated create is a
	// 409 rather than a failure worth failing the test over.
	const createUser = async (telegramId: string) => {
		const res = await userRequest(ctx.app.getHttpServer())
			.post('/users')
			.send({ telegramId })

		expect([201, 409]).toContain(res.status)
	}

	describe('GET /eligibility/policy', () => {
		it('returns the current block-list and terms version', async () => {
			const res = await userRequest(ctx.app.getHttpServer())
				.get(POLICY_PATH)
				.expect(200)

			expect(res.body).toMatchObject({
				blockedCountries: [],
				termsVersion: FIRST_TERMS_VERSION,
			})
			expect(typeof res.body.updatedAt).toBe('string')
		})

		it('never exposes the document bytes on the hot path', async () => {
			const res = await userRequest(ctx.app.getHttpServer())
				.get(POLICY_PATH)
				.expect(200)

			expect(res.body).not.toHaveProperty('termsFile')
		})

		/**
		 * Nothing seeds the row, so its absence means initial setup never ran.
		 * A 500 is the deliberate signal that the system should not be serving
		 * traffic — not a 404 inviting the caller to retry.
		 */
		it('answers 500 when initial setup has not created the policy', async () => {
			await ctx.app.get(PrismaService).eligibilityPolicy.deleteMany()

			await userRequest(ctx.app.getHttpServer())
				.get(POLICY_PATH)
				.expect(500)
		})

		it('rejects an absent api key', async () => {
			await request(ctx.app.getHttpServer()).get(POLICY_PATH).expect(403)
		})

		it('rejects a wrong api key', async () => {
			await request(ctx.app.getHttpServer())
				.get(POLICY_PATH)
				.set('x-user-key', 'wrong-key')
				.expect(403)
		})
	})

	describe('GET /eligibility/:telegramId', () => {
		it('distinguishes a never-gated user with a 404', async () => {
			await createUser(NEVER_GATED_TELEGRAM_ID)

			await userRequest(ctx.app.getHttpServer())
				.get(`${ELIGIBILITY_PATH}/${NEVER_GATED_TELEGRAM_ID}`)
				.expect(404)
		})

		it('returns the stored record for a previously gated user', async () => {
			await createUser(GATED_TELEGRAM_ID)

			await userRequest(ctx.app.getHttpServer())
				.post(ELIGIBILITY_PATH)
				.send({
					telegramId: GATED_TELEGRAM_ID,
					country: 'US',
					termsVersion: FIRST_TERMS_VERSION,
				})
				.expect(201)

			const res = await userRequest(ctx.app.getHttpServer())
				.get(`${ELIGIBILITY_PATH}/${GATED_TELEGRAM_ID}`)
				.expect(200)

			expect(res.body).toMatchObject({
				country: 'US',
				termsVersion: FIRST_TERMS_VERSION,
			})
		})

		it('rejects an absent api key', async () => {
			await request(ctx.app.getHttpServer())
				.get(`${ELIGIBILITY_PATH}/${GATED_TELEGRAM_ID}`)
				.expect(403)
		})
	})

	describe('POST /eligibility', () => {
		it('overwrites a previous record rather than appending history', async () => {
			await createUser(GATED_TELEGRAM_ID)

			await userRequest(ctx.app.getHttpServer())
				.post(ELIGIBILITY_PATH)
				.send({
					telegramId: GATED_TELEGRAM_ID,
					country: 'US',
					termsVersion: 1,
				})
				.expect(201)

			await userRequest(ctx.app.getHttpServer())
				.post(ELIGIBILITY_PATH)
				.send({
					telegramId: GATED_TELEGRAM_ID,
					country: 'FR',
					termsVersion: 2,
				})
				.expect(201)

			const prisma = ctx.app.get(PrismaService)

			const rows = await prisma.userEligibility.findMany()

			expect(rows).toHaveLength(1)
			expect(rows[0]).toMatchObject({ country: 'FR', termsVersion: 2 })
		})

		it('stores the Cloudflare sentinels verbatim', async () => {
			await createUser(GATED_TELEGRAM_ID)

			const res = await userRequest(ctx.app.getHttpServer())
				.post(ELIGIBILITY_PATH)
				.send({
					telegramId: GATED_TELEGRAM_ID,
					country: 'T1',
					termsVersion: FIRST_TERMS_VERSION,
				})
				.expect(201)

			expect(res.body.country).toBe('T1')
		})

		it('rejects an absent api key', async () => {
			await request(ctx.app.getHttpServer())
				.post(ELIGIBILITY_PATH)
				.send({
					telegramId: GATED_TELEGRAM_ID,
					country: 'US',
					termsVersion: 1,
				})
				.expect(403)
		})
	})

	describe('PUT /eligibility/policy', () => {
		it('replaces the block-list and is visible on the next read', async () => {
			await adminRequest()
				.put(POLICY_PATH)
				.send({ blockedCountries: ['RU', 'kp'] })
				.expect(200)

			const res = await userRequest(ctx.app.getHttpServer())
				.get(POLICY_PATH)
				.expect(200)

			expect(res.body.blockedCountries).toEqual(['RU', 'KP'])
		})

		it('accepts an empty list as "nobody is blocked"', async () => {
			await adminRequest()
				.put(POLICY_PATH)
				.send({ blockedCountries: ['RU'] })
				.expect(200)

			await adminRequest()
				.put(POLICY_PATH)
				.send({ blockedCountries: [] })
				.expect(200)

			const res = await userRequest(ctx.app.getHttpServer())
				.get(POLICY_PATH)
				.expect(200)

			expect(res.body.blockedCountries).toEqual([])
		})

		it('rejects an invalid code with a message naming it', async () => {
			const res = await adminRequest()
				.put(POLICY_PATH)
				.send({ blockedCountries: ['RU', 'QQ'] })
				.expect(400)

			expect(JSON.stringify(res.body)).toContain('QQ')
		})

		it('leaves termsFile and termsVersion untouched', async () => {
			const prisma = ctx.app.get(PrismaService)

			await prisma.eligibilityPolicy.update({
				where: { singleton: POLICY_SINGLETON },
				data: { termsFile: new Uint8Array([1, 2, 3]), termsVersion: 7 },
			})

			await adminRequest()
				.put(POLICY_PATH)
				.send({ blockedCountries: ['RU'] })
				.expect(200)

			const policy = await prisma.eligibilityPolicy.findUniqueOrThrow({
				where: { singleton: POLICY_SINGLETON },
			})

			expect(policy.termsVersion).toBe(7)
			expect(Array.from(policy.termsFile)).toEqual([1, 2, 3])
		})

		it('rejects a user-level api key', async () => {
			await userRequest(ctx.app.getHttpServer())
				.put(POLICY_PATH)
				.send({ blockedCountries: [] })
				.expect(403)
		})
	})

	describe('POST /eligibility/policy/terms', () => {
		it('writes the bytes and increments the version by one', async () => {
			const document = Buffer.from('%PDF-1.4 placeholder')

			const res = await adminRequest()
				.post(TERMS_PATH)
				.attach(TERMS_FILE_FIELD, document, 'terms.pdf')
				.expect(201)

			expect(res.body.termsVersion).toBe(FIRST_TERMS_VERSION + 1)

			const prisma = ctx.app.get(PrismaService)

			const policy = await prisma.eligibilityPolicy.findUniqueOrThrow({
				where: { singleton: POLICY_SINGLETON },
			})

			expect(Buffer.from(policy.termsFile).toString()).toBe(
				document.toString(),
			)
		})

		// The document and the version move together or not at all, so each
		// upload advances the version exactly once alongside its own bytes.
		it('keeps the document and version in step across uploads', async () => {
			const prisma = ctx.app.get(PrismaService)

			for (const [index, body] of [
				'first',
				'second',
				'third',
			].entries()) {
				await adminRequest()
					.post(TERMS_PATH)
					.attach(TERMS_FILE_FIELD, Buffer.from(body), 'terms.pdf')
					.expect(201)

				const policy = await prisma.eligibilityPolicy.findUniqueOrThrow(
					{ where: { singleton: POLICY_SINGLETON } },
				)

				expect(policy.termsVersion).toBe(
					FIRST_TERMS_VERSION + index + 1,
				)
				expect(Buffer.from(policy.termsFile).toString()).toBe(body)
			}
		})

		it('leaves blockedCountries unchanged', async () => {
			await adminRequest()
				.put(POLICY_PATH)
				.send({ blockedCountries: ['RU'] })
				.expect(200)

			await adminRequest()
				.post(TERMS_PATH)
				.attach(TERMS_FILE_FIELD, Buffer.from('doc'), 'terms.pdf')
				.expect(201)

			const res = await userRequest(ctx.app.getHttpServer())
				.get(POLICY_PATH)
				.expect(200)

			expect(res.body.blockedCountries).toEqual(['RU'])
		})

		it('rejects a request with no document attached', async () => {
			await adminRequest().post(TERMS_PATH).expect(400)
		})

		it('rejects a user-level api key', async () => {
			await userRequest(ctx.app.getHttpServer())
				.post(TERMS_PATH)
				.attach(TERMS_FILE_FIELD, Buffer.from('doc'), 'terms.pdf')
				.expect(403)
		})

		it('does not advance the version when the key is refused', async () => {
			await userRequest(ctx.app.getHttpServer())
				.post(TERMS_PATH)
				.attach(TERMS_FILE_FIELD, Buffer.from('doc'), 'terms.pdf')
				.expect(403)

			const prisma = ctx.app.get(PrismaService)

			const policy = await prisma.eligibilityPolicy.findUniqueOrThrow({
				where: { singleton: POLICY_SINGLETON },
			})

			expect(policy.termsVersion).toBe(FIRST_TERMS_VERSION)
			expect(Array.from(policy.termsFile)).toEqual(
				Array.from(TEST_TERMS_DOCUMENT),
			)
		})
	})
})
