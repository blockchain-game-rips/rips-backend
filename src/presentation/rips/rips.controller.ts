import { Controller, Get } from '@nestjs/common'
import { GetStakesUseCase } from 'src/application/use-cases/get-stakes/get-stakes.use-case'
import { StakeResponseDto, toStakeResponseDto } from './stake-response.dto'

@Controller()
export class RipsController {
	constructor(private readonly getStakesUseCase: GetStakesUseCase) {}

	@Get('stakes')
	async getStakes(): Promise<StakeResponseDto[]> {
		const stakes = await this.getStakesUseCase.execute()

		return stakes.map(toStakeResponseDto)
	}
}
