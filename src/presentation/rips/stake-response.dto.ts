import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { AvailableStake } from '../../domain/value-objects/available-stake'
import { ConfigDto, RoundDto, toConfigDto, toRoundDto } from './rips-schemas'

const StakeZ = z.object({
	id: z.number(),
	currentConfig: ConfigDto.schema.nullable(),
})

const AvailableStakeResponseZ = z.object({
	stake: StakeZ,
	fillingRound: RoundDto.schema.nullable(),
})

export class AvailableStakeResponseDto extends createZodDto(
	AvailableStakeResponseZ,
) {}

export function toAvailableStakeResponseDto(
	availableStake: AvailableStake,
	priceUsd: number,
): AvailableStakeResponseDto {
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
