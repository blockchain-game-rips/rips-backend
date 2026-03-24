import { Module } from '@nestjs/common'
import { RevealTicketPrizesService } from 'src/application/use-cases/reveal-ticket-prizes/reveal-ticket-prizes.service'
import { RevealTicketPrizesUseCase } from 'src/application/use-cases/reveal-ticket-prizes/reveal-ticket-prizes.use-case'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
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
