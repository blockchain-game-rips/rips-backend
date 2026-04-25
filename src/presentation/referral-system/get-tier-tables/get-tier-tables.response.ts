import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CurrencyId } from '../../../domain/value-objects/currency-id'
import { ReferrerTierTable } from '../../../domain/value-objects/referral-system'
import { CurrencyDto, toCurrencyDto } from '../../shared/currency.dto'

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
	prices: Map<CurrencyId, number>,
): GetTierTablesResponseDto {
	return {
		tierTables: tierTables.map((table) => ({
			currency: toCurrencyDto(
				table.currency,
				prices.get(table.currency.id) ?? 0,
			),
			defaultFeePercent: table.defaultFeePercent,
			tiers: table.tiers.map((tier) => ({
				minVolume: tier.minVolume.toString(),
				feePercent: tier.feePercent,
			})),
		})),
	}
}
