import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { AvailableStake } from '../../../domain/value-objects/available-stake'
import { configSchema, toConfigDto } from '../shared/config.dto'
import { roundSchema, toRoundDto } from '../shared/round.dto'

const stakeSchema = z.object({
	id: z.number(),
	currentConfig: configSchema.nullable(),
})

const getStakesResponseSchema = z.object({
	stake: stakeSchema,
	fillingRound: roundSchema.nullable(),
})

export class GetStakesResponseDto extends createZodDto(
	getStakesResponseSchema,
) {}

export function toGetStakesResponseDto(
	availableStake: AvailableStake,
	priceUsd: number,
): GetStakesResponseDto {
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
