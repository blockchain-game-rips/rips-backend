import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import {
	CurrencyId,
	tokenIdSchema,
} from '../../../domain/value-objects/currency-id'

const getCurrencyIdResponseSchema = z.object({
	id: tokenIdSchema,
})

export class GetCurrencyIdResponseDto extends createZodDto(
	getCurrencyIdResponseSchema,
) {}

export function toGetCurrencyIdResponseDto(
	id: CurrencyId,
): GetCurrencyIdResponseDto {
	return { id }
}
