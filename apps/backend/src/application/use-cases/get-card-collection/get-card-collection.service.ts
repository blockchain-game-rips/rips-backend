import { Injectable } from '@nestjs/common'
import { EIP155 } from '../../../constants'
import { CardCollection } from '../../../domain/value-objects/card-collection'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'
import { EntryPayoutRepository } from '../../interfaces/repositories/entry-payout.repository'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	GetCardCollectionInput,
	GetCardCollectionUseCase,
} from './get-card-collection.use-case'

@Injectable()
export class GetCardCollectionService extends GetCardCollectionUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly entryPayoutRepository: EntryPayoutRepository,
	) {
		super()
	}

	async execute({
		telegramId,
		presetId,
	}: GetCardCollectionInput): Promise<CardCollection[]> {
		const user = await this.getUserUseCase.execute({ telegramId })

		const userAddress = toEvmAddress(user.wallet.namespaceToAddress[EIP155])

		return this.entryPayoutRepository.getCardCollectionsByPreset(
			userAddress,
			presetId,
		)
	}
}
