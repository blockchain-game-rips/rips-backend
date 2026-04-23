import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { EvmAddress } from '../../../domain/value-objects/evm-address'

export abstract class RewardRepository {
	abstract getAvailableRewards(
		userAddress: EvmAddress,
	): Promise<CurrencyAmount[]>

	abstract getAccruedRewards(
		userAddress: EvmAddress,
	): Promise<CurrencyAmount[]>
}
