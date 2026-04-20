import { Inject, Injectable } from '@nestjs/common'
import { getAddress } from 'viem'
import {
	GetCompletedRoundsArgs,
	RoundRepository,
} from '../../application/interfaces/repositories/round.repository'
import { CompletedRound } from '../../domain/entities/round'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { EvmCurrencyService } from '../evm/evm-currency.service'
import { RIPS_CONTRACT } from '../rips/rips.constants'
import { IndexerService } from './indexer.service'
import { fromRoundRaw } from './utils'

@Injectable()
export class IndexerRoundRepository extends RoundRepository {
	private readonly chainId: number

	constructor(
		private readonly indexer: IndexerService,
		private readonly evmCurrencyService: EvmCurrencyService,
		@Inject(RIPS_CONTRACT) contract: ChainAddress,
	) {
		super()
		this.chainId = Number(contract.chain.reference)
	}

	async getCompletedRounds({
		limit,
		cursor,
	}: GetCompletedRoundsArgs): Promise<CompletedRound[]> {
		const { rounds } = await this.indexer.sdk.GetCompletedRounds({
			limit,
			cursor: cursor?.toString(),
		})

		return Promise.all(
			rounds.map(async (r) => {
				const currency = await this.evmCurrencyService.fromAddress(
					getAddress(r.config.currency),
					this.chainId,
				)

				//TODO: get rid of as unknown as
				return fromRoundRaw(r, currency) as unknown as CompletedRound
			}),
		)
	}

	async getNextCompletedRound(
		afterRoundId: number,
	): Promise<CompletedRound | null> {
		// TODO: implement GraphQL query for next completed round after afterRoundId
		throw new Error('Not implemented')
	}
}
