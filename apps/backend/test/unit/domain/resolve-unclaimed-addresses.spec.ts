import { resolveUnclaimedAddresses } from '../../../src/domain/services/claim-utils'
import { AddressesActions } from '../../../src/domain/value-objects/actions'
import { toEvmAddress } from '../../../src/domain/value-objects/evm-address'

const ALICE = toEvmAddress('0x1111111111111111111111111111111111111111')
const BOB = toEvmAddress('0x2222222222222222222222222222222222222222')

function actions(overrides: Partial<AddressesActions>): AddressesActions {
	return { purchases: [], claims: [], refunds: [], ...overrides }
}

describe('resolveUnclaimedAddresses', () => {
	it('returns every buyer when nothing is claimed', () => {
		const result = resolveUnclaimedAddresses(
			actions({
				purchases: [
					{ userAddress: ALICE, entryCount: 3, startEntryIndex: 0 },
					{ userAddress: BOB, entryCount: 2, startEntryIndex: 3 },
				],
			}),
		)

		expect(result).toEqual([ALICE, BOB])
	})

	it('keeps a buyer whose claim covered only some of their entries', () => {
		const result = resolveUnclaimedAddresses(
			actions({
				purchases: [
					{ userAddress: ALICE, entryCount: 5, startEntryIndex: 0 },
				],
				claims: [{ userAddress: ALICE, entryCount: 2, amount: 10n }],
			}),
		)

		expect(result).toEqual([ALICE])
	})

	it('drops a buyer whose claims cover every entry', () => {
		const result = resolveUnclaimedAddresses(
			actions({
				purchases: [
					{ userAddress: ALICE, entryCount: 5, startEntryIndex: 0 },
				],
				claims: [
					{ userAddress: ALICE, entryCount: 2, amount: 10n },
					{ userAddress: ALICE, entryCount: 3, amount: 0n },
				],
			}),
		)

		expect(result).toEqual([])
	})

	it('sums the entries of a buyer who purchased more than once', () => {
		const result = resolveUnclaimedAddresses(
			actions({
				purchases: [
					{ userAddress: ALICE, entryCount: 2, startEntryIndex: 0 },
					{ userAddress: ALICE, entryCount: 3, startEntryIndex: 2 },
				],
				claims: [{ userAddress: ALICE, entryCount: 2, amount: 10n }],
			}),
		)

		expect(result).toEqual([ALICE])
	})

	it('drops a buyer whose entries paid out nothing but were still claimed', () => {
		const result = resolveUnclaimedAddresses(
			actions({
				purchases: [
					{ userAddress: ALICE, entryCount: 1, startEntryIndex: 0 },
				],
				claims: [{ userAddress: ALICE, entryCount: 1, amount: 0n }],
			}),
		)

		expect(result).toEqual([])
	})

	it('lists each address once however many purchases it made', () => {
		const result = resolveUnclaimedAddresses(
			actions({
				purchases: [
					{ userAddress: ALICE, entryCount: 1, startEntryIndex: 0 },
					{ userAddress: ALICE, entryCount: 1, startEntryIndex: 1 },
				],
			}),
		)

		expect(result).toEqual([ALICE])
	})
})
