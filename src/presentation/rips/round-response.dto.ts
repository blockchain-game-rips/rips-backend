import { Round, RoundStatus } from 'src/domain/entities/round'
import { AddressesActions } from 'src/domain/value-objects/actions'
import { StakeResponseDto, toStakeResponseDto } from './stake-response.dto'

export type RoundResponseDto = {
	id: number
	stake: StakeResponseDto
	actions: AddressesActions
	status: RoundStatus
	startTime: string //ISO date
}

export function toRoundResponseDto(round: Round): RoundResponseDto {
	return {
		id: round.id,
		stake: toStakeResponseDto(round.stake),
		actions: round.actions,
		status: round.status,
		startTime: round.startTime.toISOString(),
	}
}
