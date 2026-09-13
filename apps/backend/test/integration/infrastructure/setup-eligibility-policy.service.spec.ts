import { Histogram } from 'prom-client'
import {
	FIRST_TERMS_VERSION,
	POLICY_SINGLETON,
	PrismaEligibilityRepository,
} from '../../../src/infrastructure/prisma/eligibility.repository'
import { PrismaService } from '../../../src/infrastructure/prisma/prisma.service'
import { SetupEligibilityPolicyService } from '../../../src/infrastructure/provision/setup-eligibility-policy.service'
import { usePostgres } from '../../utils/postgres'

const TERMS_DOCUMENT = new Uint8Array([1, 2, 3])
const REPLACEMENT_DOCUMENT = new Uint8Array([4, 5, 6])

describe('SetupEligibilityPolicyService', () => {
	usePostgres()

	let prisma: PrismaService
	let service: SetupEligibilityPolicyService

	beforeAll(async () => {
		const queryDuration = {
			observe: vi.fn(),
		} as unknown as Histogram<string>

		prisma = new PrismaService(queryDuration)
		await prisma.$connect()

		service = new SetupEligibilityPolicyService(
			new PrismaEligibilityRepository(prisma),
		)
	})

	afterAll(async () => {
		await prisma.$disconnect()
	})

	beforeEach(async () => {
		await prisma.eligibilityPolicy.deleteMany()
	})

	const readPolicy = () =>
		prisma.eligibilityPolicy.findUniqueOrThrow({
			where: { singleton: POLICY_SINGLETON },
		})

	it('creates the policy singleton from the supplied document', async () => {
		await service.setup(TERMS_DOCUMENT)

		const stored = await readPolicy()

		expect(stored.termsVersion).toBe(FIRST_TERMS_VERSION)
		expect(stored.blockedCountries).toEqual([])
		expect(Array.from(stored.termsFile)).toEqual(Array.from(TERMS_DOCUMENT))
	})

	/**
	 * Re-running setup must not bump the version every deploy, which would make
	 * every user re-consent for nothing.
	 */
	it('leaves an existing policy untouched when re-run', async () => {
		await service.setup(TERMS_DOCUMENT)

		const before = await readPolicy()

		await service.setup(REPLACEMENT_DOCUMENT)

		const after = await readPolicy()

		expect(after.termsVersion).toBe(before.termsVersion)
		expect(Array.from(after.termsFile)).toEqual(Array.from(TERMS_DOCUMENT))
		expect(after.updatedAt).toEqual(before.updatedAt)
	})

	it('refuses an empty document', async () => {
		await expect(service.setup(new Uint8Array())).rejects.toThrow()

		await expect(readPolicy()).rejects.toThrow()
	})
})
