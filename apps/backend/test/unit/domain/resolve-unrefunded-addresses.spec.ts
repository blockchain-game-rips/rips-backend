import { resolveUnrefundedAddresses } from '../../../src/domain/services/refund-utils'
import { AddressesActions } from '../../../src/domain/value-objects/actions'
import { toEvmAddress } from '../../../src/domain/value-objects/evm-address'

const ALICE = toEvmAddress('0x1111111111111111111111111111111111111111')
const BOB = toEvmAddress('0x2222222222222222222222222222222222222222')

function actions(overrides: Partial<AddressesActions>): AddressesActions {
	return { purchases: [], claims: [], refunds: [], ...overrides }
}

describe('resolveUnrefundedAddresses', () => {
	it('lists each address once however many purchases it made', () => {
		const result = resolveUnrefundedAddresses(
			actions({
				purchases: [
					{ userAddress: ALICE, entryCount: 1, startEntryIndex: 0 },
					{ userAddress: ALICE, entryCount: 1, startEntryIndex: 1 },
				],
			}),
		)

		expect(result).toEqual([ALICE])
	})

	it('returns every buyer when nothing is refunded', () => {
		const result = resolveUnrefundedAddresses(
			actions({
				purchases: [
					{ userAddress: ALICE, entryCount: 3, startEntryIndex: 0 },
					{ userAddress: BOB, entryCount: 2, startEntryIndex: 3 },
				],
			}),
		)

		expect(result).toEqual([ALICE, BOB])
	})

	it('drops a buyer that was already refunded', () => {
		const result = resolveUnrefundedAddresses(
			actions({
				purchases: [
					{ userAddress: ALICE, entryCount: 3, startEntryIndex: 0 },
					{ userAddress: BOB, entryCount: 2, startEntryIndex: 3 },
				],
				refunds: [{ userAddress: ALICE, amount: 30n }],
			}),
		)

		expect(result).toEqual([BOB])
	})

	it('drops a buyer refunded once however many purchases it made', () => {
		const result = resolveUnrefundedAddresses(
			actions({
				purchases: [
					{ userAddress: ALICE, entryCount: 1, startEntryIndex: 0 },
					{ userAddress: ALICE, entryCount: 4, startEntryIndex: 1 },
				],
				refunds: [{ userAddress: ALICE, amount: 50n }],
			}),
		)

		expect(result).toEqual([])
	})

	it('returns nothing when there were no purchases', () => {
		expect(resolveUnrefundedAddresses(actions({}))).toEqual([])
	})
})
