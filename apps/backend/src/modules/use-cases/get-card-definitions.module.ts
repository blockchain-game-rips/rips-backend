import { Module } from '@nestjs/common'
import { GetCardDefinitionsService } from '../../application/use-cases/get-card-definitions/get-card-definitions.service'
import { GetCardDefinitionsUseCase } from '../../application/use-cases/get-card-definitions/get-card-definitions.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [PrismaModule],
	providers: [
		{
			provide: GetCardDefinitionsUseCase,
			useClass: GetCardDefinitionsService,
		},
	],
	exports: [GetCardDefinitionsUseCase],
})
export class GetCardDefinitionsModule {}
