import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { TransactionDto } from '../../shared/transaction.dto'

const adminTransactionResponseSchema = z.object({
	transaction: TransactionDto.schema,
})

export class AdminTransactionResponseDto extends createZodDto(
	adminTransactionResponseSchema,
) {}
