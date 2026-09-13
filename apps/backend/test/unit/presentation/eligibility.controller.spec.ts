import { BadRequestException } from '@nestjs/common'
import { EligibilityPolicyNotFoundError } from '../../../src/application/use-cases/get-eligibility-policy/get-eligibility-policy.use-case'
import { EligibilityNotFoundError } from '../../../src/application/use-cases/get-user-eligibility/get-user-eligibility.use-case'
import { toCountryCode } from '../../../src/domain/value-objects/country-code'
import { EligibilityController } from '../../../src/presentation/eligibility/eligibility.controller'
import { TELEGRAM_ID } from '../../fixtures/entities'
import {
	makeMockGetEligibilityPolicyUseCase,
	makeMockGetUserEligibilityUseCase,
	makeMockRecordEligibilityUseCase,
	makeMockSetBlockedCountriesUseCase,
	makeMockUploadTermsDocumentUseCase,
} from '../../mocks/use-cases'

const POLICY = {
	blockedCountries: [toCountryCode('RU')],
	termsVersion: 2,
	updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

const EXPECTED_POLICY_DTO = {
	blockedCountries: ['RU'],
	termsVersion: 2,
	updatedAt: '2026-01-01T00:00:00.000Z',
}

const USER_ELIGIBILITY = {
	country: 'US',
	termsVersion: 2,
	acceptedAt: new Date('2026-01-02T00:00:00.000Z'),
}

const EXPECTED_USER_ELIGIBILITY_DTO = {
	country: 'US',
	termsVersion: 2,
	acceptedAt: '2026-01-02T00:00:00.000Z',
}

describe('EligibilityController', () => {
	const getPolicy = makeMockGetEligibilityPolicyUseCase()
	const getUserEligibility = makeMockGetUserEligibilityUseCase()
	const recordEligibility = makeMockRecordEligibilityUseCase()
	const setBlockedCountries = makeMockSetBlockedCountriesUseCase()
	const uploadTerms = makeMockUploadTermsDocumentUseCase()

	const controller = new EligibilityController(
		getPolicy,
		getUserEligibility,
		recordEligibility,
		setBlockedCountries,
		uploadTerms,
	)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('GET /eligibility/policy', () => {
		it('should return the block-list and terms version', async () => {
			getPolicy.execute.mockResolvedValue(POLICY)

			expect(await controller.getPolicy()).toEqual(EXPECTED_POLICY_DTO)
		})

		it('should propagate a missing singleton', async () => {
			getPolicy.execute.mockRejectedValue(
				new EligibilityPolicyNotFoundError('missing'),
			)

			await expect(controller.getPolicy()).rejects.toThrow(
				EligibilityPolicyNotFoundError,
			)
		})
	})

	describe('GET /eligibility/:telegramId', () => {
		it('should return the stored record', async () => {
			getUserEligibility.execute.mockResolvedValue(USER_ELIGIBILITY)

			const result = await controller.getUserEligibility({
				telegramId: TELEGRAM_ID,
			})

			expect(result).toEqual(EXPECTED_USER_ELIGIBILITY_DTO)
		})

		it('should propagate the never-gated absence', async () => {
			getUserEligibility.execute.mockRejectedValue(
				new EligibilityNotFoundError('never gated'),
			)

			await expect(
				controller.getUserEligibility({ telegramId: TELEGRAM_ID }),
			).rejects.toThrow(EligibilityNotFoundError)
		})
	})

	describe('POST /eligibility', () => {
		it('should record the pass without taking a timestamp from the caller', async () => {
			recordEligibility.execute.mockResolvedValue(USER_ELIGIBILITY)

			const result = await controller.recordEligibility({
				telegramId: TELEGRAM_ID,
				country: 'US',
				termsVersion: 2,
			})

			expect(result).toEqual(EXPECTED_USER_ELIGIBILITY_DTO)
			expect(recordEligibility.execute).toHaveBeenCalledWith({
				telegramId: TELEGRAM_ID,
				country: 'US',
				termsVersion: 2,
			})
		})
	})

	describe('PUT /eligibility/policy', () => {
		it('should replace the block-list', async () => {
			setBlockedCountries.execute.mockResolvedValue(POLICY)

			const blockedCountries = [toCountryCode('RU')]

			const result = await controller.setBlockedCountries({
				blockedCountries,
			})

			expect(result).toEqual(EXPECTED_POLICY_DTO)
			expect(setBlockedCountries.execute).toHaveBeenCalledWith({
				blockedCountries,
			})
		})
	})

	describe('POST /eligibility/policy/terms', () => {
		it('should pass the uploaded bytes through', async () => {
			uploadTerms.execute.mockResolvedValue(POLICY)

			const buffer = Buffer.from('pdf-bytes')

			const result = await controller.uploadTerms({ buffer })

			expect(result).toEqual(EXPECTED_POLICY_DTO)
			expect(uploadTerms.execute).toHaveBeenCalledWith({
				termsFile: buffer,
			})
		})

		it('should reject a request carrying no document', async () => {
			await expect(controller.uploadTerms(undefined)).rejects.toThrow(
				BadRequestException,
			)

			expect(uploadTerms.execute).not.toHaveBeenCalled()
		})
	})
})
