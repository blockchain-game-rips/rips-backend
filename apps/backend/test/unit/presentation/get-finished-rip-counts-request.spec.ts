import { GetFinishedRipCountsQueryDto } from '../../../src/presentation/rips/get-finished-rip-counts/get-finished-rip-counts.request'

const CHECKSUMMED_ADDRESS = '0x000000000000000000000000000000000000dEaD'

describe('GetFinishedRipCountsQueryDto', () => {
	it('accepts a checksummed user address', () => {
		const result = GetFinishedRipCountsQueryDto.schema.safeParse({
			userAddress: CHECKSUMMED_ADDRESS,
		})

		expect(result.success).toBe(true)
		expect(result.data?.userAddress).toBe(CHECKSUMMED_ADDRESS)
	})

	// The counts are always scoped to one user, so an omitted address is a
	// malformed request rather than a request for a global total.
	it('rejects a missing user address', () => {
		const result = GetFinishedRipCountsQueryDto.schema.safeParse({})

		expect(result.success).toBe(false)
	})

	it('rejects a malformed user address', () => {
		const result = GetFinishedRipCountsQueryDto.schema.safeParse({
			userAddress: 'not-an-address',
		})

		expect(result.success).toBe(false)
	})

	it('normalises a lowercase user address to its checksummed form', () => {
		const result = GetFinishedRipCountsQueryDto.schema.safeParse({
			userAddress: CHECKSUMMED_ADDRESS.toLowerCase(),
		})

		expect(result.success).toBe(true)
		expect(result.data?.userAddress).toBe(CHECKSUMMED_ADDRESS)
	})
})
