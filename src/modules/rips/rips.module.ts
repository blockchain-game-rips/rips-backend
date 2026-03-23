import { Module } from '@nestjs/common'
import { StakeRepository } from 'src/application/interfaces/repositories/stake.repository'
import { GetStakesService } from 'src/application/use-cases/get-stakes/get-stakes.service'
import { GetStakesUseCase } from 'src/application/use-cases/get-stakes/get-stakes.use-case'
import { IndexerService } from 'src/infrastructure/indexer/indexer.service'
import { IndexerStakeRepository } from 'src/infrastructure/indexer/stake.repository'
import { MainCurrencyModule } from 'src/modules/main-currency/main-currency.module'
import { RipsController } from 'src/presentation/rips/rips.controller'

@Module({
	imports: [MainCurrencyModule],
	controllers: [RipsController],
	providers: [
		IndexerService,
		{ provide: StakeRepository, useClass: IndexerStakeRepository },
		{ provide: GetStakesUseCase, useClass: GetStakesService },
	],
})
export class RipsModule {}
