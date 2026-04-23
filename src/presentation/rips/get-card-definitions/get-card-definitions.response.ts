import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Card } from '../../../domain/value-objects/card'

const cardSchema = z.object({
	id: z.number(),
	name: z.string(),
	tier: z.number(),
	imageUrl: z.string(),
})

const getCardDefinitionsResponseSchema = z.object({
	tiers: z.array(z.array(cardSchema)),
})

export class GetCardDefinitionsResponseDto extends createZodDto(
	getCardDefinitionsResponseSchema,
) {}

export function toGetCardDefinitionsResponseDto(
	tiers: Card[][],
): GetCardDefinitionsResponseDto {
	return {
		tiers: tiers.map((tier) =>
			tier.map((card) => ({
				id: card.id,
				name: card.name,
				tier: card.tier,
				imageUrl: card.imageUrl,
			})),
		),
	}
}
