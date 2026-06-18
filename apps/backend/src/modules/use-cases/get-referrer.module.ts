import { Module } from '@nestjs/common'
import { GetReferrerService } from '../../application/use-cases/get-referrer/get-referrer.service'
import { GetReferrerUseCase } from '../../application/use-cases/get-referrer/get-referrer.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, IndexerModule],
	providers: [
		{
			provide: GetReferrerUseCase,
			useClass: GetReferrerService,
		},
	],
	exports: [GetReferrerUseCase],
})
export class GetReferrerModule {}
