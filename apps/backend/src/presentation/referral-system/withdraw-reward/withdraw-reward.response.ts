import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { TransactionAttemptWith } from '../../../domain/value-objects/transaction-attempt'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'
import {
	toTransactionAttemptWithDto,
	transactionAttemptSchema,
} from '../../shared/transaction-attempt.dto'

const withdrawRewardResponseSchema = z.object({
	withdrawal: transactionAttemptSchema(CurrencyAmountDto.schema),
})

export class WithdrawRewardResponseDto extends createZodDto(
	withdrawRewardResponseSchema,
) {}

export function toWithdrawRewardResponseDto(
	attempt: TransactionAttemptWith<CurrencyAmount>,
): WithdrawRewardResponseDto {
	return {
		withdrawal: toTransactionAttemptWithDto(
			attempt,
			toPricedCurrencyAmountDto,
		),
	}
}
