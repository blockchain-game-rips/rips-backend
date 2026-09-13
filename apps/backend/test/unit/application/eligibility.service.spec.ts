import { GetEligibilityPolicyService } from '../../../src/application/use-cases/get-eligibility-policy/get-eligibility-policy.service'
import { EligibilityPolicyNotFoundError } from '../../../src/application/use-cases/get-eligibility-policy/get-eligibility-policy.use-case'
import { GetTermsDocumentService } from '../../../src/application/use-cases/get-terms-document/get-terms-document.service'
import { GetUserEligibilityService } from '../../../src/application/use-cases/get-user-eligibility/get-user-eligibility.service'
import { EligibilityNotFoundError } from '../../../src/application/use-cases/get-user-eligibility/get-user-eligibility.use-case'
import { RecordEligibilityService } from '../../../src/application/use-cases/record-eligibility/record-eligibility.service'
import { SetBlockedCountriesService } from '../../../src/application/use-cases/set-blocked-countries/set-blocked-countries.service'
import { UploadTermsDocumentService } from '../../../src/application/use-cases/upload-terms-document/upload-terms-document.service'
import { toCountryCode } from '../../../src/domain/value-objects/country-code'
import { TELEGRAM_ID } from '../../fixtures/entities'
import { makeMockEligibilityRepository } from '../../mocks/use-cases'

const POLICY = {
	blockedCountries: [toCountryCode('RU')],
	termsVersion: 3,
	updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

const USER_ELIGIBILITY = {
	country: 'US',
	termsVersion: 3,
	acceptedAt: new Date('2026-01-02T00:00:00.000Z'),
}

describe('GetEligibilityPolicyService', () => {
	const repo = makeMockEligibilityRepository()
	const service = new GetEligibilityPolicyService(repo)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should return the policy singleton', async () => {
		repo.findPolicy.mockResolvedValue(POLICY)

		expect(await service.execute()).toEqual(POLICY)
	})

	it('should throw when the singleton is missing', async () => {
		repo.findPolicy.mockResolvedValue(null)

		await expect(service.execute()).rejects.toThrow(
			EligibilityPolicyNotFoundError,
		)
	})
})

describe('GetUserEligibilityService', () => {
	const repo = makeMockEligibilityRepository()
	const service = new GetUserEligibilityService(repo)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should return the stored record', async () => {
		repo.findByTelegramId.mockResolvedValue(USER_ELIGIBILITY)

		expect(await service.execute({ telegramId: TELEGRAM_ID })).toEqual(
			USER_ELIGIBILITY,
		)
	})

	it('should throw when the user was never gated', async () => {
		repo.findByTelegramId.mockResolvedValue(null)

		await expect(
			service.execute({ telegramId: TELEGRAM_ID }),
		).rejects.toThrow(EligibilityNotFoundError)
	})
})

describe('RecordEligibilityService', () => {
	const repo = makeMockEligibilityRepository()
	const service = new RecordEligibilityService(repo)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should stamp acceptedAt at write time', async () => {
		repo.record.mockResolvedValue(USER_ELIGIBILITY)

		const before = new Date()

		await service.execute({
			telegramId: TELEGRAM_ID,
			country: 'US',
			termsVersion: 3,
		})

		const recorded = repo.record.mock.calls[0][0]

		expect(recorded.telegramId).toBe(TELEGRAM_ID)
		expect(recorded.country).toBe('US')
		expect(recorded.termsVersion).toBe(3)
		expect(recorded.acceptedAt.getTime()).toBeGreaterThanOrEqual(
			before.getTime(),
		)
	})
})

describe('SetBlockedCountriesService', () => {
	const repo = makeMockEligibilityRepository()
	const service = new SetBlockedCountriesService(repo)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should replace the block-list', async () => {
		repo.replaceBlockedCountries.mockResolvedValue(POLICY)

		const blockedCountries = [toCountryCode('RU'), toCountryCode('KP')]

		await service.execute({ blockedCountries })

		expect(repo.replaceBlockedCountries).toHaveBeenCalledWith(
			blockedCountries,
		)
	})

	it('should accept an empty list as "nobody is blocked"', async () => {
		repo.replaceBlockedCountries.mockResolvedValue({
			...POLICY,
			blockedCountries: [],
		})

		await service.execute({ blockedCountries: [] })

		expect(repo.replaceBlockedCountries).toHaveBeenCalledWith([])
	})
})

describe('UploadTermsDocumentService', () => {
	const repo = makeMockEligibilityRepository()
	const service = new UploadTermsDocumentService(repo)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should hand the bytes to the repository as one write', async () => {
		repo.replaceTermsDocument.mockResolvedValue(POLICY)

		const termsFile = Buffer.from('pdf-bytes')

		await service.execute({ termsFile })

		expect(repo.replaceTermsDocument).toHaveBeenCalledWith(termsFile)
	})
})

describe('GetTermsDocumentService', () => {
	const repo = makeMockEligibilityRepository()
	const service = new GetTermsDocumentService(repo)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('should return the stored bytes', async () => {
		const termsFile = Buffer.from('pdf-bytes')

		repo.findTermsDocument.mockResolvedValue(termsFile)

		expect(await service.execute()).toEqual(termsFile)
	})

	/**
	 * An empty document is a document: the row exists, so this is a real answer
	 * about the policy rather than the broken-deployment signal a missing row is.
	 */
	it('should return an empty document rather than treating it as missing', async () => {
		repo.findTermsDocument.mockResolvedValue(new Uint8Array([]))

		const document = await service.execute()

		expect(document.byteLength).toBe(0)
	})

	it('should throw when the singleton is missing', async () => {
		repo.findTermsDocument.mockResolvedValue(null)

		await expect(service.execute()).rejects.toThrow(
			EligibilityPolicyNotFoundError,
		)
	})
})
