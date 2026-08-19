import { GetPayoutsService } from '../../../src/application/use-cases/get-payouts/get-payouts.service'
import { EIP155 } from '../../../src/constants'
import { EntryPayout } from '../../../src/domain/value-objects/entry-payout'
import { toEvmAddress } from '../../../src/domain/value-objects/evm-address'
import { EVM_ADDRESS, MOCK_USER, TELEGRAM_ID } from '../../fixtures/entities'
import {
	makeMockEntryPayoutRepository,
	makeMockGetUserUseCase,
} from '../../mocks/use-cases'

const RIP_ID = 42
const ENTRY_NUMBER = 3
const PAYOUT_AMOUNT = 1_200_000_000_000_000n

describe('GetPayoutsService', () => {
	const getUser = makeMockGetUserUseCase()
	const entryPayoutRepository = makeMockEntryPayoutRepository()
	const service = new GetPayoutsService(getUser, entryPayoutRepository)

	const USER_ADDRESS = toEvmAddress(
		MOCK_USER.wallet.namespaceToAddress[EIP155],
	)

	beforeEach(() => {
		vi.clearAllMocks()
		getUser.execute.mockResolvedValue(MOCK_USER)
		entryPayoutRepository.find.mockResolvedValue([])
	})

	it('passes an empty filter through unchanged', async () => {
		await service.execute({ telegramId: TELEGRAM_ID, filter: {} })

		expect(entryPayoutRepository.find).toHaveBeenCalledWith(
			USER_ADDRESS,
			{},
		)
	})

	it('passes ripId and revealed through to the repository', async () => {
		await service.execute({
			telegramId: TELEGRAM_ID,
			filter: { ripId: RIP_ID, revealed: false },
		})

		expect(entryPayoutRepository.find).toHaveBeenCalledWith(USER_ADDRESS, {
			ripId: RIP_ID,
			revealed: false,
		})
	})

	it('queries the address that belongs to the caller', async () => {
		await service.execute({ telegramId: TELEGRAM_ID, filter: {} })

		expect(entryPayoutRepository.find).toHaveBeenCalledWith(EVM_ADDRESS, {})
	})

	it('returns what the repository returns', async () => {
		const payouts: EntryPayout[] = [
			{
				ripId: RIP_ID,
				userAddress: USER_ADDRESS,
				entryNumber: ENTRY_NUMBER,
				payoutAmount: PAYOUT_AMOUNT,
				revealed: true,
				card: { id: 1, name: 'Ace', tier: 0, imageUrl: 'ace.png' },
			},
		]
		entryPayoutRepository.find.mockResolvedValue(payouts)

		const result = await service.execute({
			telegramId: TELEGRAM_ID,
			filter: { ripId: RIP_ID },
		})

		expect(result).toEqual(payouts)
	})
})
