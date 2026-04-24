import { Module } from '@nestjs/common'
import { GetReferrerService } from '../../application/use-cases/get-referrer/get-referrer.service'
import { GetReferrerUseCase } from '../../application/use-cases/get-referrer/get-referrer.use-case'

@Module({
	providers: [
		{
			provide: GetReferrerUseCase,
			useClass: GetReferrerService,
		},
	],
	exports: [GetReferrerUseCase],
})
export class GetReferrerModule {}
