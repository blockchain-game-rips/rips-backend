import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Currency } from '../../domain/entities/currency'
import { ChainAddressDto, toChainAddressDto } from './chain-address.dto'

const currencySchema = z
	.object({
		id: z.string(),
		priceUsd: z.number(),
		chainAddress: ChainAddressDto.schema,
		symbol: z.string(),
		name: z.string(),
		decimals: z.number(),
	})
	.meta({ id: 'CurrencyDto' })

export class CurrencyDto extends createZodDto(currencySchema) {}

export function toCurrencyDto(
	currency: Currency,
	priceUsd: number,
): CurrencyDto {
	return {
		id: currency.id,
		chainAddress: toChainAddressDto(currency.chainAddress),
		symbol: currency.symbol,
		name: currency.name,
		decimals: currency.decimals,
		priceUsd,
	}
}
