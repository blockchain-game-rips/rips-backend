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

const HashSchema = z.object({
	stringValue: z.string().nullable(),
})

const EventMetadataSchema = z.object({
	transactionHash: HashSchema,
	blockNumber: z.number(),
	blockTimeStamp: z.number(),
})

export const OrderSchema = z.object({
	state: OrderState,
	fulfilledDstEventMetadata: EventMetadataSchema.nullable(),
})
export type Order = z.infer<typeof OrderSchema>
