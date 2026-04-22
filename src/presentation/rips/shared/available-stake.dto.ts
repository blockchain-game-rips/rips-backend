import { createZodDto } from 'nestjs-zod'
import z from 'zod'
import { AvailableStake } from '../../../domain/value-objects/available-stake'
import { configSchema, toConfigDto } from './config.dto'
import { roundSchema, toRoundDto } from './round.dto'

const stakeSchema = z.object({
	id: z.number(),
	currentConfig: configSchema.nullable(),
})

const availableStakeSchema = z.object({
	stake: stakeSchema,
	fillingRound: roundSchema.nullable(),
})

export class AvailableStakeDto extends createZodDto(availableStakeSchema) {}

export function toAvailableStakeDto(
	availableStake: AvailableStake,
	priceUsd: number,
): AvailableStakeDto {
	if (availableStake.fillingRound === null) {
		return {
			stake: {
				id: availableStake.stake.id,
				currentConfig: toConfigDto(
					availableStake.stake.currentConfig,
					priceUsd,
				),
			},
			fillingRound: null,
		}
	}

	return {
		stake: {
			id: availableStake.stake.id,
			currentConfig: null,
		},
		fillingRound: toRoundDto(availableStake.fillingRound, priceUsd),
	}
}
