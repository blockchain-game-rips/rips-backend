import { Body, Controller, Put, UseGuards } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { SetPausedUseCase } from '../../application/use-cases/set-paused/set-paused.use-case'
import { TransactionDto, toTransactionDto } from '../shared/transaction.dto'
import { AdminApiKeyGuard } from './admin-api-key.guard'
import { SetPausedBodyDto } from './set-paused/set-paused.request'

@Controller('admin')
@UseGuards(AdminApiKeyGuard)
export class AdminController {
	constructor(private readonly setPausedUseCase: SetPausedUseCase) {}

	@Put('contract/paused')
	@ZodResponse({ type: TransactionDto })
	async setPaused(@Body() body: SetPausedBodyDto): Promise<TransactionDto> {
		const transaction = await this.setPausedUseCase.execute({
			isPaused: body.isPaused,
		})

		return toTransactionDto(transaction)
	}
}
