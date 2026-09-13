import { Module } from '@nestjs/common'
import { SetBlockedCountriesService } from '../../application/use-cases/set-blocked-countries/set-blocked-countries.service'
import { SetBlockedCountriesUseCase } from '../../application/use-cases/set-blocked-countries/set-blocked-countries.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [PrismaModule],
	providers: [
		{
			provide: SetBlockedCountriesUseCase,
			useClass: SetBlockedCountriesService,
		},
	],
	exports: [SetBlockedCountriesUseCase],
})
export class SetBlockedCountriesModule {}
