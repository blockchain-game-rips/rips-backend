import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { Rip, RipStatus } from '../../../domain/entities/rip'
import { CurrencyDto } from '../../shared/currency.dto'
import { PricedCurrency } from '../../shared/pricing/priced-currency'
import { configSchema, toConfigDto } from './config.dto'
import { startEntryIndexSchema } from './purchase.dto'

const purchaseActionSchema = z.object({
	userAddress: z.string(),
	entryCount: z.number(),
	startEntryIndex: startEntryIndexSchema,
})

const claimActionSchema = z.object({
	userAddress: z.string(),
	entryCount: z.number(),
	amount: z.string(),
})

const refundActionSchema = z.object({
	userAddress: z.string(),
	amount: z.string(),
})

const actionsSchema = z.object({
	purchases: z.array(purchaseActionSchema),
	claims: z.array(claimActionSchema),
	refunds: z.array(refundActionSchema),
})

const randomsSchema = z.object({
	a: z.string(),
	b: z.string(),
})

export const ripSchema = z
	.object({
		id: z.number(),
		presetId: z.number(),
		currency: CurrencyDto.schema,
		config: configSchema,
		actions: actionsSchema,
		status: z.enum(RipStatus),
		startTime: z.string(),
		randoms: randomsSchema.optional(),
	})
	.meta({ id: 'RipDto' })

export class RipDto extends createZodDto(ripSchema) {}

function toActionsDto(actions: Rip['actions']): z.infer<typeof actionsSchema> {
	return {
		purchases: actions.purchases.map((p) => ({
			userAddress: p.userAddress,
			entryCount: p.entryCount,
			startEntryIndex: p.startEntryIndex,
		})),
		claims: actions.claims.map((c) => ({
			userAddress: c.userAddress,
			entryCount: c.entryCount,
			amount: c.amount.toString(),
		})),
		refunds: actions.refunds.map((r) => ({
			userAddress: r.userAddress,
			amount: r.amount.toString(),
		})),
	}
}

export function toRipDto(rip: Rip): RipDto {
	return {
		id: rip.id,
		presetId: rip.preset.id,
		currency: new PricedCurrency(rip.currency),
		config: toConfigDto(rip.config),
		actions: toActionsDto(rip.actions),
		status: rip.status,
		startTime: rip.startTime.toISOString(),
		randoms:
			rip.randoms !== undefined
				? {
						a: rip.randoms.a.toString(),
						b: rip.randoms.b.toString(),
					}
				: undefined,
	}
}
