import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { CardCollection } from '../../../domain/value-objects/card-collection'

const cardSchema = z.object({
	id: z.number(),
	name: z.string(),
	tier: z.number(),
	imageUrl: z.string(),
})

const cardCollectionSchema = z.array(
	z.object({
		card: cardSchema,
		count: z.number(),
	}),
)

const getCardCollectionResponseSchema = z.object({
	tiers: z.array(cardCollectionSchema),
})

export class GetCardCollectionResponseDto extends createZodDto(
	getCardCollectionResponseSchema,
) {}

export function toGetCardCollectionResponseDto(
	tiers: CardCollection[],
): GetCardCollectionResponseDto {
	return {
		tiers: tiers.map((tier) =>
			tier.map(({ card, count }) => ({
				card: {
					id: card.id,
					name: card.name,
					tier: card.tier,
					imageUrl: card.imageUrl,
				},
				count,
			})),
		),
	}
}
