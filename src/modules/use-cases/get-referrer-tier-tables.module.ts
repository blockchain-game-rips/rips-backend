import { Module } from '@nestjs/common'
import { GetReferrerTierTablesService } from '../../application/use-cases/get-referrer-tier-tables/get-referrer-tier-tables.service'
import { GetReferrerTierTablesUseCase } from '../../application/use-cases/get-referrer-tier-tables/get-referrer-tier-tables.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'

@Module({
	imports: [IndexerModule],
	providers: [
		{
			provide: GetReferrerTierTablesUseCase,
			useClass: GetReferrerTierTablesService,
		},
	],
	exports: [GetReferrerTierTablesUseCase],
})
export class GetReferrerTierTablesModule {}
