import { Module } from '@nestjs/common'
import { SetReferrerFrozenService } from '../../application/use-cases/set-referrer-frozen/set-referrer-frozen.service'
import { SetReferrerFrozenUseCase } from '../../application/use-cases/set-referrer-frozen/set-referrer-frozen.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { RipsModule } from '../../infrastructure/rips/rips.module'

@Module({
	imports: [RipsModule, PrismaModule],
	providers: [
		{
			provide: SetReferrerFrozenUseCase,
			useClass: SetReferrerFrozenService,
		},
	],
	exports: [SetReferrerFrozenUseCase],
})
export class SetReferrerFrozenModule {}
