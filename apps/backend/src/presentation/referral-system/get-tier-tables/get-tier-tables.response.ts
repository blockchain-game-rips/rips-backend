import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { ReferrerTierTable } from '../../../domain/value-objects/referral-system'
import { CurrencyDto } from '../../shared/currency.dto'
import { PricedCurrency } from '../../shared/pricing/priced-currency'

const referrerTierSchema = z.object({
	minVolume: z.string(),
	feePercent: z.number(),
})

const referrerTierTableSchema = z.object({
	currency: CurrencyDto.schema,
	defaultFeePercent: z.number(),
	tiers: z.array(referrerTierSchema),
})

const getTierTablesResponseSchema = z.object({
	tierTables: z.array(referrerTierTableSchema),
})

export class GetTierTablesResponseDto extends createZodDto(
	getTierTablesResponseSchema,
) {}

export function toGetTierTablesResponseDto(
	tierTables: ReferrerTierTable[],
): GetTierTablesResponseDto {
	return {
		tierTables: tierTables.map((table) => ({
			currency: new PricedCurrency(table.currency),
			defaultFeePercent: table.defaultFeePercent,
			tiers: table.tiers.map((tier) => ({
				minVolume: tier.minVolume.toString(),
				feePercent: tier.feeBps,
			})),
		})),
	}
}
