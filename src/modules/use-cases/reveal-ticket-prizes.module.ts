import { Module } from '@nestjs/common'
import { RevealTicketPrizesService } from '../../application/use-cases/reveal-ticket-prizes/reveal-ticket-prizes.service'
import { RevealTicketPrizesUseCase } from '../../application/use-cases/reveal-ticket-prizes/reveal-ticket-prizes.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { GetUserModule } from './get-user.module'

@Module({
	imports: [GetUserModule, PrismaModule],
	providers: [
		{
			provide: RevealTicketPrizesUseCase,
			useClass: RevealTicketPrizesService,
		},
	],
	exports: [RevealTicketPrizesUseCase],
})
export class RevealTicketPrizesModule {}
