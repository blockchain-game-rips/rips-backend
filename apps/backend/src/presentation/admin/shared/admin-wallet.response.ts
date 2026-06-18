import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { GetAdminWalletResult } from '../../../application/use-cases/get-admin-wallet/get-admin-wallet.use-case'
import {
	CurrencyAmountDto,
	toPricedCurrencyAmountDto,
} from '../../shared/currency-amount.dto'

const adminWalletSchema = z.object({
	kind: z.literal('admin'),
	namespaceToAddress: z.record(z.string(), z.string()),
})

const adminWalletResponseSchema = z.object({
	wallet: adminWalletSchema,
	balance: CurrencyAmountDto.schema,
})

export class AdminWalletResponseDto extends createZodDto(
	adminWalletResponseSchema,
) {}

export function toAdminWalletResponseDto(
	result: GetAdminWalletResult,
): AdminWalletResponseDto {
	return {
		wallet: result.wallet,
		balance: toPricedCurrencyAmountDto(result.balance),
	}
}
