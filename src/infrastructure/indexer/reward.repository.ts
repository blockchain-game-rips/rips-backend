import { Injectable } from '@nestjs/common'
import { RewardRepository } from '../../application/interfaces/repositories/reward.repository'
import { CurrencyAmount } from '../../domain/value-objects/currency-amount'
import { EvmAddress } from '../../domain/value-objects/evm-address'

@Injectable()
export class IndexerRewardRepository extends RewardRepository {
	getAvailableRewards(_userAddress: EvmAddress): Promise<CurrencyAmount[]> {
		throw new Error(
			'TODO: implement getAvailableRewards in IndexerRewardRepository',
		)
	}
}
