import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { AvailableStake } from '../../domain/value-objects/available-stake'
import { ConfigDto, toConfigDto } from './rips-schemas'
import { RoundResponseDto, toRoundResponseDto } from './round-response.dto'

const StakeZ = z.object({
	id: z.number(),
	currentConfig: ConfigDto.schema.nullable(),
})

const AvailableStakeResponseZ = z.object({
	stake: StakeZ,
	fillingRound: RoundResponseDto.schema.nullable(),
})

export class AvailableStakeResponseDto extends createZodDto(
	AvailableStakeResponseZ,
) {}

export function toAvailableStakeResponseDto(
	availableStake: AvailableStake,
): AvailableStakeResponseDto {
	if (availableStake.fillingRound === null) {
		return {
			stake: {
				id: availableStake.stake.id,
				currentConfig: toConfigDto(availableStake.stake.currentConfig),
			},
			fillingRound: null,
		}
	}

	return {
		stake: {
			id: availableStake.stake.id,
			currentConfig: null,
		},
		fillingRound: toRoundResponseDto(availableStake.fillingRound),
	}
}
