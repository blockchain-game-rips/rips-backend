import * as z from 'zod'

export const OrderState = z.enum([
	'None',
	'Created',
	'Fulfilled',
	'SentUnlock',
	'ClaimedUnlock',
	'SentOrderCancel',
	'OrderCancelled',
	'ClaimedOrderCancel',
])
export type OrderState = z.infer<typeof OrderState>

const HashPropertySchema = z.object({
	stringValue: z.string(),
})

const EventMetadataSchema = z.object({
	transactionHash: HashPropertySchema,
})

const OfferWithMetadataSchema = z.object({
	chainId: z.object({
		stringValue: z.string(),
	}),
	finalAmount: z.object({
		stringValue: z.string(),
	}),
})

export const OrderSchema = z.object({
	state: OrderState,
	giveOfferWithMetadata: OfferWithMetadataSchema,
	takeOfferWithMetadata: OfferWithMetadataSchema.nullable(),
	createdSrcEventMetadata: EventMetadataSchema,
	fulfilledDstEventMetadata: EventMetadataSchema.nullable(),
})
export type Order = z.infer<typeof OrderSchema>
