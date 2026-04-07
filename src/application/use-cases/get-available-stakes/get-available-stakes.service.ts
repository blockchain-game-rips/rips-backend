import { Injectable } from '@nestjs/common'
import { StakeRepository } from 'src/application/interfaces/repositories/stake.repository'
import { RoundStatus } from 'src/domain/entities/round'
import { AvailableStake } from 'src/domain/value-objects/available-stake'
import { GetAvailableStakesUseCase } from './get-available-stakes.use-case'

@Injectable()
export class GetAvailableStakesService extends GetAvailableStakesUseCase {
	constructor(private readonly stakeRepository: StakeRepository) {
		super()
	}

	async execute(): Promise<AvailableStake[]> {
		const stakesWithRounds =
			await this.stakeRepository.getStakesWithOngoingRounds()

		const result: AvailableStake[] = []

		for (const { stake, ongoingRounds } of stakesWithRounds) {
			const fillingRound =
				ongoingRounds.find((r) => r.status === RoundStatus.FILLING) ??
				null

			if (fillingRound !== null) {
				result.push({ stake, fillingRound })
				continue
			}

			if (stake.currentConfig !== null) {
				result.push({
					stake: { ...stake, currentConfig: stake.currentConfig },
					fillingRound: null,
				})
			}
		}

		return result
	}
}
