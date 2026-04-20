import { Injectable } from '@nestjs/common'
import { EIP155 } from '../../../constants'
import { toEvmAddress } from '../../../domain/value-objects/evm-address'
import { TicketPrize } from '../../../domain/value-objects/ticket-prize'
import { TicketPrizeRepository } from '../../interfaces/repositories/ticket-prize.repository'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	GetUnrevealedPrizesInput,
	GetUnrevealedPrizesUseCase,
} from './get-unrevealed-prizes.use-case'

@Injectable()
export class GetUnrevealedPrizesService extends GetUnrevealedPrizesUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly ticketPrizeRepository: TicketPrizeRepository,
	) {
		super()
	}

	async execute({
		telegramId,
	}: GetUnrevealedPrizesInput): Promise<TicketPrize[]> {
		const user = await this.getUserUseCase.execute({ telegramId })

		return this.ticketPrizeRepository.getUnrevealed(
			toEvmAddress(user.wallet.namespaceToAddress[EIP155]),
		)
	}
}
