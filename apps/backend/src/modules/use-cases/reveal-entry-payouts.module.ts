import { Module } from '@nestjs/common'
import { RevealEntryPayoutsService } from '../../application/use-cases/reveal-entry-payouts/reveal-entry-payouts.service'
import { RevealEntryPayoutsUseCase } from '../../application/use-cases/reveal-entry-payouts/reveal-entry-payouts.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, PrismaModule],
	providers: [
		{
			provide: RevealEntryPayoutsUseCase,
			useClass: RevealEntryPayoutsService,
		},
	],
	exports: [RevealEntryPayoutsUseCase],
})
export class RevealEntryPayoutsModule {}
