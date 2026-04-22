import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { RoundDto } from './rips-schemas'

const GetCompletedRoundsResponseZ = z.object({
	rounds: z.array(RoundDto.schema),
	nextCursor: z.number().nullable(),
})

export class GetCompletedRoundsResponseDto extends createZodDto(
	GetCompletedRoundsResponseZ,
) {}

const GetOngoingRoundsResponseZ = z.object({
	rounds: z.array(RoundDto.schema),
})

export class GetOngoingRoundsResponseDto extends createZodDto(
	GetOngoingRoundsResponseZ,
) {}
