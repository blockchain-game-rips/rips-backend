import { Histogram } from 'prom-client'
import {
	FIRST_TERMS_VERSION,
	POLICY_SINGLETON,
	PrismaEligibilityRepository,
} from '../../../src/infrastructure/prisma/eligibility.repository'
import { PrismaService } from '../../../src/infrastructure/prisma/prisma.service'
import { usePostgres } from '../../utils/postgres'

const EXISTING_TERMS_VERSION = 4
const EXISTING_DOCUMENT = new Uint8Array([1, 2, 3])

describe('PrismaEligibilityRepository terms upload', () => {
	usePostgres()

	let prisma: PrismaService
	let repository: PrismaEligibilityRepository

	beforeAll(async () => {
		const queryDuration = {
			observe: vi.fn(),
		} as unknown as Histogram<string>

		prisma = new PrismaService(queryDuration)
		await prisma.$connect()

		repository = new PrismaEligibilityRepository(prisma)
	})

	afterAll(async () => {
		await prisma.$disconnect()
	})

	beforeEach(async () => {
		await prisma.eligibilityPolicy.deleteMany()

		await prisma.eligibilityPolicy.create({
			data: {
				singleton: POLICY_SINGLETON,
				blockedCountries: ['RU'],
				termsVersion: EXISTING_TERMS_VERSION,
				termsFile: EXISTING_DOCUMENT,
			},
		})
	})

	const readPolicy = () =>
		prisma.eligibilityPolicy.findUniqueOrThrow({
			where: { singleton: POLICY_SINGLETON },
		})

	it('advances the document and the version together', async () => {
		const document = new Uint8Array([9, 9, 9])

		const policy = await repository.replaceTermsDocument(document)

		expect(policy.termsVersion).toBe(EXISTING_TERMS_VERSION + 1)

		const stored = await readPolicy()

		expect(stored.termsVersion).toBe(EXISTING_TERMS_VERSION + 1)
		expect(Array.from(stored.termsFile)).toEqual([9, 9, 9])
	})

	/**
	 * The row is created by the first write rather than by the migration, so an
	 * upload against a policy-less database establishes the singleton instead of
	 * failing on a missing row.
	 */
	it('creates the policy singleton when no row exists', async () => {
		await prisma.eligibilityPolicy.deleteMany()

		const document = new Uint8Array([4, 5, 6])

		const policy = await repository.replaceTermsDocument(document)

		expect(policy.termsVersion).toBe(FIRST_TERMS_VERSION)
		expect(policy.blockedCountries).toEqual([])

		const stored = await readPolicy()

		expect(stored.termsVersion).toBe(FIRST_TERMS_VERSION)
		expect(Array.from(stored.termsFile)).toEqual([4, 5, 6])
	})

	/**
	 * The guarantee ticket 04 actually buys: a failure leaves the previous
	 * document and version intact, never a new document under an old version or
	 * a bumped version with stale bytes.
	 */
	it('leaves the previous document and version intact when the write fails', async () => {
		const failing = vi
			.spyOn(prisma.eligibilityPolicy, 'upsert')
			.mockRejectedValueOnce(new Error('write failed'))

		await expect(
			repository.replaceTermsDocument(new Uint8Array([7, 7, 7])),
		).rejects.toThrow('write failed')

		failing.mockRestore()

		const stored = await readPolicy()

		expect(stored.termsVersion).toBe(EXISTING_TERMS_VERSION)
		expect(Array.from(stored.termsFile)).toEqual(
			Array.from(EXISTING_DOCUMENT),
		)
	})

	/**
	 * Every upload must advance the version exactly once, so two uploads land
	 * two bumps and no document is filed under another's version.
	 *
	 * Note this asserts the outcome, not the mechanism: the driver may serialize
	 * these two calls, so passing does not by itself prove the increment is
	 * atomic. The atomicity argument lives in `replaceTermsDocument` — the bump
	 * is computed by the database, never read into the app and written back.
	 */
	it('advances the version once per upload when uploads overlap', async () => {
		await Promise.all([
			repository.replaceTermsDocument(new Uint8Array([1])),
			repository.replaceTermsDocument(new Uint8Array([2])),
		])

		const stored = await readPolicy()

		expect(stored.termsVersion).toBe(EXISTING_TERMS_VERSION + 2)
	})

	it('leaves blockedCountries untouched', async () => {
		await repository.replaceTermsDocument(new Uint8Array([5]))

		const stored = await readPolicy()

		expect(stored.blockedCountries).toEqual(['RU'])
	})
})
