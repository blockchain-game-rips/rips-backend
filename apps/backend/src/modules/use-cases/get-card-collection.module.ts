import { Module } from '@nestjs/common'
import { GetCardCollectionService } from '../../application/use-cases/get-card-collection/get-card-collection.service'
import { GetCardCollectionUseCase } from '../../application/use-cases/get-card-collection/get-card-collection.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, PrismaModule],
	providers: [
		{
			provide: GetCardCollectionUseCase,
			useClass: GetCardCollectionService,
		},
	],
	exports: [GetCardCollectionUseCase],
})
export class GetCardCollectionModule {}
